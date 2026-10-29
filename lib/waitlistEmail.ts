import {
  displaySessionDate,
  sessionTitle,
} from "./programSessions";

export type WaitlistEmailDetails = {
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

export function buildWaitlistEmail(
  details: WaitlistEmailDetails,
  from: string,
) {
  const title = sessionTitle(details.session_number);
  const loginUrl = "https://thedadclub.com.au/members/login";

  const rows = [
    ["Session", `${details.session_number}. ${title}`],
    ["Starts", displaySessionDate(details.starts_at)],
    ["Ends", displaySessionDate(details.ends_at)],
    ["Time zone", "Adelaide time, including daylight saving"],
    ["Venue / delivery", details.venue_name],
    ["Address / details", details.venue_address],
  ].filter(([, value]) => value);

  const text = [
    "A place has opened up.",
    "",
    "A place was available when we checked a Dad Club session you're waitlisted for:",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "This email does not reserve a place or confirm a booking. Availability can change, and places are checked again when you book.",
    "",
    `Sign in to view availability and book: ${loginUrl}`,
    "",
    "If the session is full again, your waitlist entry remains. We send one availability alert per waitlist joining, so please check the member area for further openings.",
    "",
    "You can leave the waitlist in your member area.",
    "",
    "Need a hand? Reply to this email.",
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
        <title>The Dad Club — A place has opened up</title>
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
                A place has opened up.
              </h1>
              <p style="font-size:16px;line-height:1.7;">
                A place was available when we checked a Dad Club
                session you&apos;re waitlisted for:
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
                <strong>This email does not reserve a place or
                confirm a booking.</strong> Availability can change,
                and places are checked again when you book.
              </p>
              <p style="margin:28px 0;">
                <a href="${loginUrl}" style="display:inline-block;padding:16px 24px;background:#173A2C;color:#F4F0E5;text-decoration:none;border-radius:28px;font-size:14px;font-weight:bold;">
                  SIGN IN TO VIEW &amp; BOOK →
                </a>
              </p>
              <p style="font-size:14px;line-height:1.7;color:#52645A;">
                If the session is full again, your waitlist entry
                remains. We send one availability alert per waitlist
                joining, so please check the member area for further
                openings. You can also leave the waitlist there.
              </p>
              <p style="font-size:16px;line-height:1.7;">
                Need a hand? Reply to this email.
              </p>
              <p style="margin-top:28px;font-weight:bold;">The Dad Club</p>
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
    subject: `The Dad Club — a place has opened up: ${title}`,
    text,
    html,
  };
}