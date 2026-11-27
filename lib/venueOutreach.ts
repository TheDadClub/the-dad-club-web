
export const VENUE_OUTREACH_STATUSES = [
  "Not contacted",
  "Emailed",
  "Responded",
  "Interested",
  "Confirmed",
  "Declined",
  "Inactive",
] as const;

export type VenueOutreachStatus =
  (typeof VENUE_OUTREACH_STATUSES)[number];

export const VENUE_OUTREACH_PRIORITIES = [
  "High",
  "Medium",
  "Low",
] as const;

export type VenueOutreachPriority =
  (typeof VENUE_OUTREACH_PRIORITIES)[number];

export const AUSTRALIAN_STATES = [
  "SA",
  "VIC",
  "NSW",
  "QLD",
  "WA",
  "TAS",
  "ACT",
  "NT",
] as const;

export const VENUE_OUTREACH_SUBJECT =
  "Community partnership opportunity – The Dad Club";

export type VenueOutreachContact = {
  id: string;
  venue_name: string;
  contact_name: string | null;
  email: string;
  phone: string | null;
  website: string | null;
  suburb: string | null;
  state: string;
  priority: VenueOutreachPriority;
  status: VenueOutreachStatus;
  notes: string | null;
  last_contacted_at: string | null;
  last_response_at: string | null;
  follow_up_at: string | null;
  venue_partner_id: string | null;
  created_at: string;
  updated_at: string;
};

export type VenueOutreachCommunication = {
  id: string;
  venue_outreach_contact_id: string;
  direction: "outbound" | "inbound";
  subject: string | null;
  occurred_at: string;
};

export function isVenueOutreachStatus(
  value: string
): value is VenueOutreachStatus {
  return VENUE_OUTREACH_STATUSES.some(
    (status) => status === value
  );
}

export function isVenueOutreachPriority(
  value: string
): value is VenueOutreachPriority {
  return VENUE_OUTREACH_PRIORITIES.some(
    (priority) => priority === value
  );
}

export function isAustralianState(
  value: string
): boolean {
  return AUSTRALIAN_STATES.some(
    (state) => state === value
  );
}

export function isActiveVenueFollowUp(
  status: VenueOutreachStatus
): boolean {
  return (
    status !== "Declined" &&
    status !== "Inactive"
  );
}
