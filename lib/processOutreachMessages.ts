
import "server-only";

import { createAdminDatabase } from "./admin";

import {
  getOutlookMessageHeaders,
  type OutlookMessage,
} from "./outlookMessages";

import {
  getOutboundRecipientEmails,
  getInboundSenderEmail,
  getCommunicationTimestamp,
  isLikelyAutomatedMessage,
  matchInitialOutboundContacts,
  type OutreachContact,
} from "./outreachMessageMatching";

import {
  outreachConversationKey,
  type OutreachConversation,
} from "./outreachContacts";

type AdminDatabase = ReturnType<
  typeof createAdminDatabase
>;

type Direction = "outbound" | "inbound";

type ProcessingResult = {
  examined: number;
  matched: number;
  recorded: number;
  duplicates: number;
  ambiguous: number;
  ignored: number;
  headersRetrieved: number;
  automatedExcluded: number;
};

function emptyResult(): ProcessingResult {
  return {
    examined: 0,
    matched: 0,
    recorded: 0,
    duplicates: 0,
    ambiguous: 0,
    ignored: 0,
    headersRetrieved: 0,
    automatedExcluded: 0,
  };
}

function getConversation(
  message: OutlookMessage,
  contact: OutreachContact,
  conversations: Map<string, OutreachConversation>
): OutreachConversation | undefined {
  if (!message.conversationId) {
    return undefined;
  }

  return conversations.get(
    outreachConversationKey(
      contact.type,
      contact.id,
      message.conversationId,
      contact.email
    )
  );
}

function rememberOutboundConversation(
  message: OutlookMessage,
  contact: OutreachContact,
  occurredAt: string,
  conversations: Map<string, OutreachConversation>
) {
  if (!message.conversationId) {
    return;
  }

  const key = outreachConversationKey(
    contact.type,
    contact.id,
    message.conversationId,
    contact.email
  );

  const existing = conversations.get(key);

  if (
    !existing ||
    Date.parse(occurredAt) <
      Date.parse(existing.firstOutboundAt)
  ) {
    conversations.set(key, {
      contactId: contact.id,
      contactType: contact.type,
      contactEmail: contact.email,
      conversationId: message.conversationId,
      firstOutboundAt: occurredAt,
    });
  }
}

async function recordCommunication({
  database,
  leaseToken,
  message,
  contact,
  direction,
  occurredAt,
}: {
  database: AdminDatabase;
  leaseToken: string;
  message: OutlookMessage;
  contact: OutreachContact;
  direction: Direction;
  occurredAt: string;
}): Promise<boolean> {
  const { data, error } = await database.rpc(
    "record_outreach_communication",
    {
      p_lease_token: leaseToken,
      p_contact_type: contact.type,
      p_contact_id: contact.id,
      p_direction: direction,
      p_provider_message_id: message.id,
      p_internet_message_id:
        message.internetMessageId ?? null,
      p_conversation_id:
        message.conversationId ?? null,
      p_subject: message.subject ?? null,
      p_contact_email: contact.email,
      p_occurred_at: occurredAt,
    }
  );

  if (error || typeof data !== "boolean") {
    throw new Error(
      "Unable to record outreach communication."
    );
  }

  return data;
}

export async function processOutreachMessages({
  database,
  leaseToken,
  accessToken,
  messages,
  direction,
  contacts,
  conversations,
  assertLease,
}: {
  database: AdminDatabase;
  leaseToken: string;
  accessToken: string;
  messages: OutlookMessage[];
  direction: Direction;
  contacts: OutreachContact[];
  conversations: Map<string, OutreachConversation>;
  assertLease: () => Promise<void>;
}): Promise<ProcessingResult> {
  const result = emptyResult();

  const ordered = messages
    .map((message) => ({
      message,
      occurredAt: getCommunicationTimestamp(
        message,
        direction
      ),
    }))
    .sort(
      (a, b) =>
        (Date.parse(a.occurredAt ?? "") || 0) -
        (Date.parse(b.occurredAt ?? "") || 0)
    );

  for (const { message, occurredAt } of ordered) {
    result.examined += 1;

    if (
      !occurredAt ||
      message.isDraft === true ||
      !message.id ||
      message.id.length > 2048 ||
      !message.conversationId
    ) {
      result.ignored += 1;
      continue;
    }

    // Exclude obvious automated correspondence
    // without making additional Graph requests.
    if (isLikelyAutomatedMessage(message)) {
      result.automatedExcluded += 1;
      result.ignored += 1;
      continue;
    }

    let candidates: OutreachContact[] = [];

    if (direction === "outbound") {
      const recipients = new Set(
        getOutboundRecipientEmails(message)
      );

      const initialMatches =
        matchInitialOutboundContacts(
          message,
          contacts
        );

      const initialKeys = new Set(
        initialMatches.map(
          (contact) =>
            `${contact.type}:${contact.id}`
        )
      );

      candidates = contacts.filter((contact) => {
        if (!recipients.has(contact.email)) {
          return false;
        }

        const conversation = getConversation(
          message,
          contact,
          conversations
        );

        const knownConversation =
          conversation !== undefined &&
          Date.parse(conversation.firstOutboundAt) <=
            Date.parse(occurredAt);

        return (
          knownConversation ||
          initialKeys.has(
            `${contact.type}:${contact.id}`
          )
        );
      });
    } else {
      const sender = getInboundSenderEmail(
        message
      );

      if (!sender) {
        result.ignored += 1;
        continue;
      }

      candidates = contacts.filter((contact) => {
        if (contact.email !== sender) {
          return false;
        }

        const conversation = getConversation(
          message,
          contact,
          conversations
        );

        return (
          conversation !== undefined &&
          Date.parse(conversation.firstOutboundAt) <=
            Date.parse(occurredAt)
        );
      });
    }

    if (candidates.length === 0) {
      result.ignored += 1;
      continue;
    }

    // Group candidates by email to prevent
    // ambiguous contact associations.
    const candidatesByEmail = new Map<
      string,
      OutreachContact[]
    >();

    for (const contact of candidates) {
      const existing =
        candidatesByEmail.get(contact.email) ?? [];

      existing.push(contact);

      candidatesByEmail.set(
        contact.email,
        existing
      );
    }

    const confirmedContacts: OutreachContact[] = [];

    for (const group of candidatesByEmail.values()) {
      if (group.length !== 1) {
        result.ambiguous += 1;
        continue;
      }

      confirmedContacts.push(group[0]);
    }

    if (confirmedContacts.length === 0) {
      result.ignored += 1;
      continue;
    }

    // Only retrieve individual headers after an
    // incoming message has matched a known contact
    // and an established outreach conversation.
    if (direction === "inbound") {
      await assertLease();

      const headers =
        await getOutlookMessageHeaders({
          accessToken,
          messageId: message.id,
          assertLease,
        });

      result.headersRetrieved += 1;

      const enrichedMessage: OutlookMessage = {
        ...message,
        internetMessageHeaders: headers,
      };

      // Exclude automated responses before recording
      // correspondence or changing contact status.
      if (isLikelyAutomatedMessage(enrichedMessage)) {
        result.automatedExcluded += 1;
        result.ignored += 1;
        continue;
      }
    }

    for (const contact of confirmedContacts) {
      await assertLease();

      result.matched += 1;

      const recorded = await recordCommunication({
        database,
        leaseToken,
        message,
        contact,
        direction,
        occurredAt,
      });

      if (recorded) {
        result.recorded += 1;
      } else {
        result.duplicates += 1;
      }

      if (direction === "outbound") {
        rememberOutboundConversation(
          message,
          contact,
          occurredAt,
          conversations
        );
      }
    }
  }

  return result;
}
