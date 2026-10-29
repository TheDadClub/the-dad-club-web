import { Temporal } from "@js-temporal/polyfill";
import {
  displaySessionDate,
  sessionTimeZone,
  sessionTitle,
} from "./programSessions";

export type SessionReminderDetails = {
  email: string;
  session_number: number;
  starts_at: string;
  ends_at: string;
  venue_name: string;
  venue_address: string;
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

function reminderDate(value: string) {
  return `${displaySessionDate(value)} — ${timeZoneLabel(value)}`;
}

export function buildSessionReminderEmail(
  details: SessionReminderDetails,
  from: string,
) {
  const title = sessionTitle(details.session_number);
  const loginUrl = "https://thedadclub.com.au/members/login";

  const rows = [
    ["Session", `${details.session_number}. ${title}`],
    ["Starts", reminderDate(details.starts_at)],
    ["Ends", reminderDate(details.ends_at)],
    ["Venue / delivery", details.venue_name],
    ["Address / joining details", details.venue_address],
  ].filter(([, value]) => value);

  const text = [
    "Your Dad Club session is coming up.",
    "",
    "A quick reminder about your booked session:",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "No perfect answers required. Come as you are, and share as much or as little as you feel comfortable with.",
    "",
    "For an in-person session, please allow a few minutes to arrive and settle in. For an online session, check your joining details and give yourself time to connect.",
    "",
    "The times above use the time zone shown. If you're joining from elsewhere, please check your local time.",
    "",
    `View your booking: ${loginUrl}`,
    "",
    "Can't make it, or have a question? Reply to this email so we can help.",
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
        <title>The Dad Club — Session reminder</title>
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
              <h1 style="margin:0 0 24px;font-size:30px;line-height:1.2;">
                Your session is coming up.
              </h1>

              <p style="font-size:16px;line-height:1.7;">
                A quick reminder about your booked Dad Club session:
              </p>

              <table role="presentation" style="width:100%;margin:24px 0;border-collapse:collapse;background:#E8EBDD;">
                ${rows.map(([label, value]) => `
                  <tr>
                    <td style="padding:12px 16px;font-size:14px;vertical-align:top;font-weight:bold;">
                      ${escapeHtml(label)}
                    </td>
                    <td style="padding:12px 16px;font-size:14px;line-height:1.6;overflow-wrap:anywhere;">
                      ${escapeHtml(value)}
                    </td>
                  </tr>
                `).join("")}
              </table>

              <p style="font-size:16px;line-height:1.7;">
                <strong>No perfect answers required.</strong>
                Come as you are, and share as much or as little
                as you feel comfortable with.
              </p>

              <p style="font-size:15px;line-height:1.7;">
                For an in-person session, please allow a few minutes
                to arrive and settle in. For an online session,
                check your joining details and give yourself time
                to connect.
              </p>

              <p style="font-size:13px;line-height:1.7;color:#52645A;">
                The times above use the time zone shown.
                If you&apos;re joining from elsewhere, please
                check your local time.
              </p>

              <p style="margin:28px 0;">
                <a href="${loginUrl}" style="display:inline-block;padding:16px 24px;background:#173A2C;color:#F4F0E5;text-decoration:none;border-radius:28px;font-size:14px;font-weight:bold;">
                  VIEW MY BOOKING →
                </a>
              </p>

              <p style="font-size:16px;line-height:1.7;">
                Can&apos;t make it, or have a question?
                Reply to this email so we can help.
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
    subject: `The Dad Club — Session reminder: ${title}`,
    text,
    html,
  };
}