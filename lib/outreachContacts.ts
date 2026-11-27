
import "server-only";

import { createAdminDatabase } from "./admin";

import type {
  OutreachContact,
  OutreachContactType,
} from "./outreachMessageMatching";

type AdminDatabase = ReturnType<
  typeof createAdminDatabase
>;

type ContactRow = {
  id: string;
  email: string | null;
};

type ConversationRow = {
  healthcare_referral_id: string | null;
  venue_outreach_contact_id: string | null;
  conversation_id: string | null;
  contact_email: string;
  occurred_at: string;
};

export type OutreachConversation = {
  contactId: string;
  contactType: OutreachContactType;
  contactEmail: string;
  conversationId: string;
  firstOutboundAt: string;
};

const PAGE_SIZE = 200;

function normaliseEmail(
  value: string | null
): string | null {
  const email = value?.trim().toLowerCase();

  if (
    !email ||
    email.length > 254 ||
    email.indexOf("@") <= 0
  ) {
    return null;
  }

  return email;
}

export function outreachConversationKey(
  contactType: OutreachContactType,
  contactId: string,
  conversationId: string,
  contactEmail: string
): string {
  return JSON.stringify([
    contactType,
    contactId,
    conversationId,
    contactEmail,
  ]);
}

async function loadContacts(
  database: AdminDatabase,
  table:
    | "healthcare_referrals"
    | "venue_outreach_contacts",
  type: OutreachContactType,
  assertLease: () => Promise<void>
): Promise<OutreachContact[]> {
  const contacts: OutreachContact[] = [];

  let cursor: string | null = null;

  while (true) {
    await assertLease();

    let query = database
      .from(table)
      .select("id,email")
      .not("email", "is", null)
      .order("id", { ascending: true })
      .limit(PAGE_SIZE);

    if (cursor) {
      query = query.gt("id", cursor);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(
        "Unable to load outreach contacts."
      );
    }

    const rows = (data ?? []) as ContactRow[];

    for (const row of rows) {
      const email = normaliseEmail(row.email);

      if (!email) {
        continue;
      }

      contacts.push({
        id: row.id,
        type,
        email,
      });
    }

    if (rows.length < PAGE_SIZE) {
      break;
    }

    cursor = rows[rows.length - 1].id;
  }

  return contacts;
}

export async function loadOutreachContacts(
  database: AdminDatabase,
  assertLease: () => Promise<void>
): Promise<OutreachContact[]> {
  const healthcare = await loadContacts(
    database,
    "healthcare_referrals",
    "healthcare",
    assertLease
  );

  const venues = await loadContacts(
    database,
    "venue_outreach_contacts",
    "venue",
    assertLease
  );

  return [...healthcare, ...venues];
}

export async function loadOutreachConversations(
  database: AdminDatabase,
  assertLease: () => Promise<void>
): Promise<Map<string, OutreachConversation>> {
  const conversations = new Map<
    string,
    OutreachConversation
  >();

  let cursor: string | null = null;

  while (true) {
    await assertLease();

    let query = database
      .from("outreach_communications")
      .select(
        "id,healthcare_referral_id,venue_outreach_contact_id,conversation_id,contact_email,occurred_at"
      )
      .eq(
        "mailbox_email",
        "hello@thedadclub.com.au"
      )
      .eq("direction", "outbound")
      .not("conversation_id", "is", null)
      .order("id", { ascending: true })
      .limit(PAGE_SIZE);

    if (cursor) {
      query = query.gt("id", cursor);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(
        "Unable to load outreach conversations."
      );
    }

    const rows = (data ?? []) as (
      ConversationRow & { id: string }
    )[];

    for (const row of rows) {
      const contactId =
        row.healthcare_referral_id ??
        row.venue_outreach_contact_id;

      const contactType: OutreachContactType =
        row.healthcare_referral_id
          ? "healthcare"
          : "venue";

      const email = normaliseEmail(
        row.contact_email
      );

      if (
        !contactId ||
        !row.conversation_id ||
        !email
      ) {
        continue;
      }

      const key = outreachConversationKey(
        contactType,
        contactId,
        row.conversation_id,
        email
      );

      const existing = conversations.get(key);

      if (
        !existing ||
        new Date(row.occurred_at).getTime() <
          new Date(
            existing.firstOutboundAt
          ).getTime()
      ) {
        conversations.set(key, {
          contactId,
          contactType,
          contactEmail: email,
          conversationId: row.conversation_id,
          firstOutboundAt: row.occurred_at,
        });
      }
    }

    if (rows.length < PAGE_SIZE) {
      break;
    }

    cursor = rows[rows.length - 1].id;
  }

  return conversations;
}
