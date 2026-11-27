
import "server-only";

import {
  normaliseOutlookEmail,
  getOutlookHeaderValues,
  type OutlookMessage,
} from "./outlookMessages";

export type OutreachContactType =
  | "healthcare"
  | "venue";

export type OutreachContact = {
  id: string;
  type: OutreachContactType;
  email: string;
};

export const OUTREACH_SUBJECTS = {
  healthcare:
    "A new Australian resource for first-time dads",
  venue:
    "Community partnership opportunity – The Dad Club",
} as const;

export function normaliseOutreachSubject(
  subject?: string | null
): string {
  return (subject ?? "")
    .normalize("NFKC")
    .replace(/[–—−]/g, "-")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function isInitialOutreachSubject(
  subject: string | undefined,
  contactType: OutreachContactType
): boolean {
  return (
    normaliseOutreachSubject(subject) ===
    normaliseOutreachSubject(
      OUTREACH_SUBJECTS[contactType]
    )
  );
}

export function getOutboundRecipientEmails(
  message: OutlookMessage
): string[] {
  // Only direct recipients qualify for automatic
  // outreach tracking.
  const recipients = message.toRecipients ?? [];

  const emails = recipients
    .map(normaliseOutlookEmail)
    .filter(
      (email): email is string => email !== null
    );

  return Array.from(new Set(emails));
}

export function getInboundSenderEmail(
  message: OutlookMessage
): string | null {
  return (
    normaliseOutlookEmail(message.from) ??
    normaliseOutlookEmail(message.sender)
  );
}

function hasAutomatedMessageHeaders(
  message: OutlookMessage
): boolean {
  const autoSubmitted = getOutlookHeaderValues(
    message,
    "Auto-Submitted"
  );

  if (
    autoSubmitted.some(
      (value) =>
        value.split(";")[0].trim() !== "no"
    )
  ) {
    return true;
  }

  const precedence = getOutlookHeaderValues(
    message,
    "Precedence"
  );

  if (
    precedence.some((value) =>
      ["bulk", "list", "junk", "auto_reply"].includes(
        value.split(";")[0].trim()
      )
    )
  ) {
    return true;
  }

  const automatedHeaders = [
    "X-Autoreply",
    "X-Autorespond",
    "X-Autoresponder",
    "X-Auto-Response",
    "X-Auto-Reply",
  ];

  if (
    automatedHeaders.some((name) =>
      getOutlookHeaderValues(message, name).some(
        (value) =>
          !["no", "false", "0"].includes(value)
      )
    )
  ) {
    return true;
  }

  const listHeaders = [
    "List-Id",
    "List-Unsubscribe",
    "List-Post",
  ];

  if (
    listHeaders.some(
      (name) =>
        getOutlookHeaderValues(message, name).length > 0
    )
  ) {
    return true;
  }

  const contentTypes = getOutlookHeaderValues(
    message,
    "Content-Type"
  );

  if (
    contentTypes.some(
      (value) =>
        value.includes("multipart/report") ||
        value.includes("message/delivery-status") ||
        value.includes("message/disposition-notification")
    )
  ) {
    return true;
  }

  const returnPaths = getOutlookHeaderValues(
    message,
    "Return-Path"
  );

  if (
    returnPaths.some(
      (value) => value.replace(/\s/g, "") === "<>"
    )
  ) {
    return true;
  }

  return false;
}

export function isLikelyAutomatedMessage(
  message: OutlookMessage
): boolean {
  if (hasAutomatedMessageHeaders(message)) {
    return true;
  }

  const subject = normaliseOutreachSubject(
    message.subject
  );

  const sender =
    getInboundSenderEmail(message) ?? "";

  const automatedSubjectPrefixes = [
    "automatic reply:",
    "automatic response:",
    "auto reply:",
    "auto-reply:",
    "autoreply:",
    "out of office:",
    "out-of-office:",
    "undeliverable:",
    "undelivered mail",
    "delivery failure:",
    "delivery status notification",
    "mail delivery failed",
    "returned mail:",
    "failure notice",
    "delivery delayed:",
    "read receipt:",
    "read:",
    "not read:",
    "automated acknowledgement:",
    "automated acknowledgment:",
  ];

  if (
    automatedSubjectPrefixes.some(
      (prefix) => subject.startsWith(prefix)
    )
  ) {
    return true;
  }

  const localPart = sender.split("@")[0];

  const automatedSenders = [
    "postmaster",
    "mailer-daemon",
    "noreply",
    "no-reply",
    "no_reply",
    "donotreply",
    "do-not-reply",
    "do_not_reply",
    "autoresponder",
    "auto-reply",
  ];

  return automatedSenders.some(
    (name) =>
      localPart === name ||
      localPart.startsWith(`${name}+`)
  );
}

export function getCommunicationTimestamp(
  message: OutlookMessage,
  direction: "outbound" | "inbound"
): string | null {
  const value =
    direction === "outbound"
      ? message.sentDateTime
      : message.receivedDateTime;

  if (!value) {
    return null;
  }

  const timestamp = new Date(value);

  if (!Number.isFinite(timestamp.getTime())) {
    return null;
  }

  return timestamp.toISOString();
}

export function matchInitialOutboundContacts(
  message: OutlookMessage,
  contacts: OutreachContact[]
): OutreachContact[] {
  if (
    message.isDraft === true ||
    isLikelyAutomatedMessage(message)
  ) {
    return [];
  }

  const recipients = new Set(
    getOutboundRecipientEmails(message)
  );

  return contacts.filter((contact) => {
    const email = contact.email
      .trim()
      .toLowerCase();

    return (
      recipients.has(email) &&
      isInitialOutreachSubject(
        message.subject,
        contact.type
      )
    );
  });
}
