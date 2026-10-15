import { Temporal } from "@js-temporal/polyfill";

export const sessionTypes = [
  { number: 1, title: "The Beginning", timing: "24 weeks before birth" },
  { number: 2, title: "Getting Ready", timing: "12 weeks before birth" },
  { number: 3, title: "Finding Your Feet", timing: "3 months after birth" },
  { number: 4, title: "One Year In", timing: "12 months after birth" },
  { number: 5, title: "The Next Chapter", timing: "24 months after birth" },
] as const;

export const sessionStatuses = [
  "draft",
  "published",
  "cancelled",
] as const;

export const sessionTimeZone = "Australia/Adelaide";

export type ProgramSession = {
  id: string;
  session_number: number;
  starts_at: string;
  ends_at: string;
  venue_name: string;
  venue_address: string;
  capacity: number;
  status: string;
  admin_notes: string;
};

export function sessionTitle(number: number) {
  return (
    sessionTypes.find((session) => session.number === number)?.title ??
    "Unknown session"
  );
}

export function adelaideInputToUTC(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    throw new Error("Invalid date format.");
  }

  const local = Temporal.PlainDateTime.from(value);

  // Reject times that do not exist or occur twice at a clock change.
  return local
    .toZonedDateTime(sessionTimeZone, { disambiguation: "reject" })
    .toInstant()
    .toString();
}

export function utcToAdelaideInput(value: string) {
  return Temporal.Instant.from(value)
    .toZonedDateTimeISO(sessionTimeZone)
    .toPlainDateTime()
    .toString({ smallestUnit: "minute" });
}

export function displaySessionDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: sessionTimeZone,
  }).format(new Date(value));
}