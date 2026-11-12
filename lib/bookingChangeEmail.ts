import { Temporal } from "@js-temporal/polyfill";
import {
  displaySessionDate,
  sessionTimeZone,
  sessionTitle,
} from "./programSessions";

export type ChangedSessionDetails = {
  session_id: string;
  starts_at: string;
  ends_at: string;
  venue_name: string;
  venue_address: string;
};

type BookingChangeDetails = {
  email: string;
  session_number: number;
  new_booking_id: string;
  old_session_details: ChangedSessionDetails;
  new_session_details: ChangedSessionDetails;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function displayTime(value: string) {
  const sessionDate = Temporal.Instant.from(value)
    .toZonedDateTimeISO(sessionTimeZone);

  const label =
    sessionDate.offset === "+10:30"
      ? "Australian Central Daylight Time (ACDT)"
      : sessionDate.offset === "+09:30"
        ? "Australian Central Standard Time (ACST)"
        : `Australia/Adelaide (UTC${sessionDate.offset})`;

  return `${displaySessionDate(value)} — ${label}`;
}

function htmlRows(rows: string[][]) {
  return rows
    .filter(([, value]) => value)
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:12px 16px;font-size:14px;vertical-align:top;font-weight:bold;">
            ${escapeHtml(label)}
          </td>
          <td style="padding:12px 16px;font-size:14px;line-height:1.6;overflow-wrap:anywhere;white-space:pre-wrap;">
            ${escapeHtml(value)}
          </td>
        </tr>
      `,
    )
    .join("");
}

export function buildBookingChangeEmail(
  details: BookingChangeDetails,
  from: string,
) {
  const title = sessionTitle(details.session_number);
  const loginUrl = "https://thedadclub.com.au/members/login";
  const previous = details.old_session_details;
  const replacement = details.new_session_details;

  const previousRows = [
    ["Previous start", displayTime(previous.starts_at)],
    ["Previous venue / delivery", previous.venue_name],
  ];

  const newRows = [
    ["Session", `${details.session_number}. ${title}`],
    ["Starts", displayTime(replacement.starts_at)],
    ["Ends", displayTime(replacement.ends_at)],
    ["Venue / delivery", replacement.venue_name],
    ["Address / details", replacement.venue_address],
    ["New booking reference", details.new_booking_id],
  ].filter(([, value]) => value);

  const text = [
    "Your booking has changed.",
    "",
    `Your ${title} booking has moved to another session date.`,
    "",
    "PREVIOUS BOOKING — PLACE RELEASED",
    ...previousRows.map(([label, value]) => `${label}: ${value}`),
    "",
    "YOUR NEW BOOKING",
    ...newRows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Your previous place has been released. Please use the new booking details above.",
    "",
    "This change uses the same session entitlement. It does not use an additional entitlement or process a payment or refund.",
    "",
    `View your current bookings: ${loginUrl}`,
    "",
    "Previous waitlist entries are not automatically reopened.",
    "",
    "If you weren't expecting this change, or need a hand, reply to this email.",
    "",
    "The Dad Club",
    "Real dads. Real conversations. No perfect answers.",
  ].join("\n");

  const html = `
    <!doctype html>
    <html lang="en-AU">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>The Dad Club — Booking Changed</title>
      </head>

      <body style="margin:0;padding:24px 12px;background:#F4F0E5;color:#173A2C;font-family:Inter,Arial,Helvetica,sans-serif;">
        <table role="presentation" style="width:100%;max-width:600px;margin:auto;border-collapse:collapse;">
          <tr>
            <td style="padding:28px;background:#173A2C;color:#F4F0E5;font-size:18px;font-weight:bold;">
              THE DAD CLUB →
            </td>
          </tr>

          <tr>
            <td style="padding:32px 28px;background:#FBF8F0;">
              <p style="margin:0 0 16px;font-size:12px;font-weight:bold;letter-spacing:2px;color:#C96632;">
                BOOKING CHANGED
              </p>

              <h1 style="margin:0 0 24px;font-size:30px;line-height:1.2;">
                A different date. Same Dad Club.
              </h1>

              <p style="font-size:16px;line-height:1.7;">
                Your ${escapeHtml(title)} booking has moved
                to another session date.
              </p>

              <h2 style="margin-top:28px;font-size:17px;">
                Previous booking — place released
              </h2>

              <table role="presentation" style="width:100%;border-collapse:collapse;background:#F4F0E5;">
                ${htmlRows(previousRows)}
              </table>

              <h2 style="margin-top:28px;font-size:20px;">
                Your new booking
              </h2>

              <table role="presentation" style="width:100%;border-collapse:collapse;background:#E8EBDD;">
                ${htmlRows(newRows)}
              </table>

              <p style="font-size:16px;line-height:1.7;">
                <strong>Your previous place has been released.</strong>
                Please use the new booking details above.
              </p>

              <p style="font-size:14px;line-height:1.7;color:#52645A;">
                This change uses the same session entitlement.
                It does not use an additional entitlement or
                process a payment or refund.
              </p>

              <p style="margin:28px 0;">
                <a href="${loginUrl}" style="display:inline-block;padding:16px 24px;background:#173A2C;color:#F4F0E5;text-decoration:none;border-radius:28px;font-size:14px;font-weight:bold;">
                  VIEW YOUR BOOKINGS →
                </a>
              </p>

              <p style="font-size:14px;line-height:1.7;color:#52645A;">
                Previous waitlist entries are not automatically reopened.
              </p>

              <p style="font-size:16px;line-height:1.7;">
                If you weren&apos;t expecting this change,
                or need a hand, reply to this email.
              </p>

              <p style="margin-top:28px;font-weight:bold;">
                The Dad Club
              </p>

              <p style="font-size:13px;line-height:1.7;color:#52645A;">
                Real dads. Real conversations. No perfect answers.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return {
    from,
    to: [details.email],
    reply_to: "hello@thedadclub.com.au",
    subject: `The Dad Club — Booking Changed: ${title}`,
    text,
    html,
  };
}