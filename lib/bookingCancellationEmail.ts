import { Temporal } from "@js-temporal/polyfill";
import {
  displaySessionDate,
  sessionTimeZone,
  sessionTitle,
} from "./programSessions";

export type BookingCancellationDetails = {
  booking_id: string;
  email: string;
  session_number: number;
  starts_at: string;
  venue_name: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function timeZoneLabel(value: string) {
  const sessionDate = Temporal.Instant.from(value)
    .toZonedDateTimeISO(sessionTimeZone);

  switch (sessionDate.offset) {
    case "+10:30":
      return "Australian Central Daylight Time (ACDT)";
    case "+09:30":
      return "Australian Central Standard Time (ACST)";
    default:
      return `Australia/Adelaide (UTC${sessionDate.offset})`;
  }
}

export function buildBookingCancellationEmail(
  details: BookingCancellationDetails,
  from: string,
) {
  const title = sessionTitle(details.session_number);
  const loginUrl = "https://thedadclub.com.au/members/login";

  const rows = [
    ["Session", `${details.session_number}. ${title}`],
    [
      "Scheduled start",
      `${displaySessionDate(details.starts_at)} — ${timeZoneLabel(details.starts_at)}`,
    ],
    ["Venue / delivery", details.venue_name],
    ["Booking reference", details.booking_id],
  ].filter(([, value]) => value);

  const text = [
    "Your booking has been cancelled.",
    "",
    "You no longer have a place reserved under this booking:",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Want to join us another time? Sign in to check your entitlements and available session dates.",
    "",
    "Another date is not booked automatically. A new booking depends on your membership, entitlement and available places.",
    "",
    "Any previous waitlist entries closed by this booking are not automatically reopened.",
    "",
    `View your member area: ${loginUrl}`,
    "",
    "If you weren't expecting this cancellation, or need a hand choosing another date, reply to this email.",
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
        <title>The Dad Club — Booking Cancelled</title>
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
                BOOKING CANCELLED
              </p>

              <h1 style="margin:0 0 24px;font-size:30px;line-height:1.2;">
                Your booking has been cancelled.
              </h1>

              <p style="font-size:16px;line-height:1.7;">
                You no longer have a place reserved under this booking:
              </p>

              <table role="presentation" style="width:100%;margin:24px 0;border-collapse:collapse;background:#E8EBDD;">
                ${rows.map(([label, value]) => `
                  <tr>
                    <td style="padding:12px 16px;font-size:14px;vertical-align:top;font-weight:bold;">
                      ${escapeHtml(label)}
                    </td>
                    <td style="padding:12px 16px;font-size:14px;line-height:1.6;overflow-wrap:anywhere;word-break:break-word;">
                      ${escapeHtml(value)}
                    </td>
                  </tr>
                `).join("")}
              </table>

              <p style="font-size:16px;line-height:1.7;">
                Want to join us another time? Sign in to check your
                entitlements and available session dates.
              </p>

              <p style="font-size:14px;line-height:1.7;color:#52645A;">
                Another date is not booked automatically. A new booking
                depends on your membership, entitlement and available
                places.
              </p>

              <p style="margin:28px 0;">
                <a href="${loginUrl}" style="display:inline-block;padding:16px 24px;background:#173A2C;color:#F4F0E5;text-decoration:none;border-radius:28px;font-size:14px;font-weight:bold;">
                  VIEW MY MEMBER AREA →
                </a>
              </p>

              <p style="font-size:14px;line-height:1.7;color:#52645A;">
                Any previous waitlist entries closed by this booking
                are not automatically reopened.
              </p>

              <p style="font-size:16px;line-height:1.7;">
                If you weren&apos;t expecting this cancellation, or
                need a hand choosing another date, reply to this email.
              </p>

              <p style="margin-top:28px;font-weight:bold;">
                The Dad Club
              </p>

              <p style="font-size:13px;line-height:1.7;color:#52645A;">
                Real dads. Real conversations. No perfect answers.
              </p>

              <p style="margin-top:24px;font-size:13px;line-height:1.7;">
                <a href="https://thedadclub.com.au/privacy/website" style="color:#173A2C;">
                  Website privacy notice
                </a>
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
    subject: `The Dad Club — Booking Cancelled: ${title}`,
    text,
    html,
  };
}