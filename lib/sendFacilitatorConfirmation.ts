type ConfirmationInput = {
  applicationId: string;
  email: string;
};

const paragraphs = [
  "Thanks for putting your hand up to facilitate with The Dad Club.",
  "We've received your expression of interest in helping first-time fathers navigate adjustment, identity, relationships, wellbeing and connection.",
  "We'll review your application and contact you if we'd like to explore the opportunity further. You don't need to submit another application while you wait.",
  "Our planned sessions run on Monday to Thursday evenings, with online and face-to-face opportunities. Availability and delivery preferences will be discussed during recruitment.",
  "Before leading groups, successful applicants will need to complete the relevant suitability checks, mandatory training and a readiness assessment.",
  "Opportunities are paid. Rates, employment terms and available work will be confirmed before any commitment. This acknowledgement is not an offer of employment or a guarantee of sessions.",
  "Need to update your details, ask a question or withdraw your application? Reply to this email.",
  "If you didn't submit an application, reply and let us know.",
];

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendFacilitatorConfirmation({
  applicationId,
  email,
}: ConfirmationInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.error(
      "Facilitator confirmation: missing server configuration.",
    );
    return false;
  }

  const text = [
    ...paragraphs.flatMap((paragraph) => [paragraph, ""]),
    "The Dad Club",
    "Real dads. Real conversations. No perfect answers.",
    "hello@thedadclub.com.au",
    "https://thedadclub.com.au",
  ].join("\n");

  const html = `
    <!doctype html>
    <html lang="en-AU">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>The Dad Club — Application received</title>
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
                FACILITATOR APPLICATION
              </p>
              <h1 style="margin:0 0 24px;font-size:30px;line-height:1.2;">
                Your application is in.
              </h1>
              ${paragraphs
                .map(
                  (paragraph) => `
                    <p style="margin:0 0 20px;font-size:16px;line-height:1.7;">
                      ${escapeHtml(paragraph)}
                    </p>
                  `,
                )
                .join("")}
              <p style="margin:28px 0 8px;font-weight:bold;">
                The Dad Club
              </p>
              <p style="margin:0;font-size:13px;line-height:1.7;color:#52645A;">
                Real dads. Real conversations. No perfect answers.
              </p>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.7;">
                <a href="https://thedadclub.com.au" style="color:#173A2C;">
                  thedadclub.com.au
                </a>
                &nbsp;&middot;&nbsp;
                <a href="https://thedadclub.com.au/privacy/website" style="color:#173A2C;">
                  Website privacy
                </a>
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
        "Idempotency-Key": `facilitator-confirmation/${applicationId}`,
      },
      body: JSON.stringify({
        from,
        to: [email],
        reply_to: "hello@thedadclub.com.au",
        subject: "The Dad Club — your facilitator application is received",
        text,
        html,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(
        "Facilitator confirmation: provider returned status",
        response.status,
      );
      return false;
    }

    const result: { id?: string } = await response.json();

    return typeof result.id === "string" && result.id.length > 0;
  } catch {
    console.error(
      "Facilitator confirmation: provider request failed.",
    );
    return false;
  }
}