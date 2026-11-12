import "server-only";

type AcknowledgementInput = {
  enquiryId: string;
  email: string;
};

export type VenueAcknowledgementResult =
  | {
      status: "accepted";
      providerId: string;
      acceptedAt: string;
    }
  | {
      status: "failed" | "not_confirmed";
    };

export async function sendVenueAcknowledgement({
  enquiryId,
  email,
}: AcknowledgementInput): Promise<VenueAcknowledgementResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.error(
      "Venue acknowledgement: missing email configuration.",
    );
    return { status: "failed" };
  }

  const text = [
    "Thanks for making room for dads.",
    "",
    "We've received your venue partnership enquiry.",
    "",
    "We're building a network of welcoming venues where first-time fathers can connect and have honest conversations about becoming a dad.",
    "",
    "We'll review the details you've shared and get in touch to discuss whether the partnership could work for both of us.",
    "",
    "Submitting an enquiry doesn't commit your venue to hosting a session. Dates, room arrangements and any partnership terms will be discussed before anything is confirmed.",
    "",
    "Our groups are planned for Monday–Thursday evenings, around dinner, with approximately 6–12 dads. Participants are encouraged to purchase their own meals and drinks, but purchases and minimum spend aren't guaranteed.",
    "",
    "Have a question or something to add? Reply to this email.",
    "",
    "If you didn't submit an enquiry, reply and let us know.",
    "",
    "The Dad Club",
    "Real dads. Real conversations. No perfect answers.",
    "hello@thedadclub.com.au",
  ].join("\n");

  const html = `
    <!doctype html>
    <html lang="en-AU">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>The Dad Club — Venue Enquiry Received</title>
      </head>
      <body style="margin:0;padding:24px 12px;background:#F4F0E5;color:#173A2C;font-family:Inter,Arial,Helvetica,sans-serif;">
        <table role="presentation" style="width:100%;max-width:600px;margin:0 auto;border-collapse:collapse;">
          <tr>
            <td style="padding:28px;background:#173A2C;color:#F4F0E5;">
              <p style="margin:0;font-size:18px;font-weight:bold;">
                THE DAD CLUB <span style="color:#D6A17C;">&rarr;</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 28px;background:#FBF8F0;">
              <p style="margin:0 0 16px;font-size:12px;font-weight:bold;letter-spacing:2px;color:#C96632;">
                VENUE PARTNERSHIPS
              </p>

              <h1 style="margin:0 0 24px;font-size:30px;line-height:1.2;">
                Thanks for making room for dads.
              </h1>

              <p style="font-size:16px;line-height:1.7;">
                We&apos;ve received your venue partnership enquiry.
              </p>

              <p style="font-size:16px;line-height:1.7;">
                We&apos;re building a network of welcoming venues
                where first-time fathers can connect and have honest
                conversations about becoming a dad.
              </p>

              <p style="font-size:16px;line-height:1.7;">
                We&apos;ll review the details you&apos;ve shared
                and get in touch to discuss whether the partnership
                could work for both of us.
              </p>

              <p style="padding:20px;background:#E8EBDD;font-size:15px;line-height:1.7;">
                <strong>There&apos;s no commitment yet.</strong>
                Submitting an enquiry doesn&apos;t commit your venue
                to hosting a session. Dates, room arrangements and
                any partnership terms will be discussed before
                anything is confirmed.
              </p>

              <p style="font-size:15px;line-height:1.7;">
                Our groups are planned for Monday–Thursday evenings,
                around dinner, with approximately 6–12 dads.
                Participants are encouraged to purchase their own
                meals and drinks, but purchases and minimum spend
                aren&apos;t guaranteed.
              </p>

              <p style="font-size:16px;line-height:1.7;">
                Have a question or something to add?
                Reply to this email.
              </p>

              <p style="margin-top:28px;font-weight:bold;">
                The Dad Club
              </p>

              <p style="font-size:13px;line-height:1.7;color:#52645A;">
                Real dads. Real conversations. No perfect answers.
              </p>

              <p style="margin-top:28px;font-size:12px;line-height:1.7;color:#52645A;">
                If you didn&apos;t submit an enquiry, reply and
                let us know.
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `venue-acknowledgement/${enquiryId}`,
      },
      body: JSON.stringify({
        from,
        to: [email],
        reply_to: "hello@thedadclub.com.au",
        subject: "The Dad Club — Venue Enquiry Received",
        text,
        html,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(
        "Venue acknowledgement: provider returned status",
        response.status,
      );

      return {
        status:
          response.status >= 500 || response.status === 408
            ? "not_confirmed"
            : "failed",
      };
    }

    const result: { id?: string } = await response.json();

    if (typeof result.id !== "string" || !result.id) {
      return { status: "not_confirmed" };
    }

    return {
      status: "accepted",
      providerId: result.id,
      acceptedAt: new Date().toISOString(),
    };
  } catch {
    console.error(
      "Venue acknowledgement: provider outcome not confirmed.",
    );

    return { status: "not_confirmed" };
  }
}