type ConfirmationInput = {
  registrationId: string;
  email: string;
};

export async function sendInterestConfirmation({
  registrationId,
  email,
}: ConfirmationInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.error("Confirmation email: missing server configuration.");
    return false;
  }

  const text = [
    "Thanks for putting your hand up.",
    "",
    "Your interest in The Dad Club has been registered.",
    "",
    "Becoming a father is a big adjustment. The Dad Club brings first-time dads together to talk about identity, relationships, mental health and everything that comes with the change.",
    "",
    "We'll be in touch when there are upcoming program details to share, including dates, locations and pricing.",
    "",
    "There's nothing to pay and no commitment to attend. This email confirms your interest, not a session booking.",
    "",
    "Have a question? Reply to this email.",
    "",
    "If you didn't register, or would like us to remove your details and stop program updates, reply and let us know.",
    "",
    "The Dad Club",
    "Real dads. Real conversations. No perfect answers.",
    "hello@thedadclub.com.au",
  ].join("\n");

  const html = `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>The Dad Club — Interest registered</title>
      </head>
      <body style="margin:0;padding:24px 12px;background:#F4F0E5;color:#173A2C;font-family:Arial,Helvetica,sans-serif;">
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
              <h1 style="margin:0 0 24px;font-size:30px;line-height:1.15;">
                Thanks for putting your hand up.
              </h1>
              <p style="font-size:16px;line-height:1.7;">
                Your interest in The Dad Club has been registered.
              </p>
              <p style="font-size:16px;line-height:1.7;">
                Becoming a father is a big adjustment. The Dad Club
                brings first-time dads together to talk about identity,
                relationships, mental health and everything that comes
                with the change.
              </p>
              <p style="font-size:16px;line-height:1.7;">
                We'll be in touch when there are upcoming program details
                to share, including dates, locations and pricing.
              </p>
              <p style="padding:20px;background:#E8EBDD;font-size:15px;line-height:1.7;">
                There's nothing to pay and no commitment to attend.
                This email confirms your interest, not a session booking.
              </p>
              <p style="font-size:16px;line-height:1.7;">
                Have a question? Reply to this email.
              </p>
              <p style="margin-top:28px;font-weight:bold;">
                The Dad Club
              </p>
              <p style="font-size:13px;line-height:1.7;color:#52645A;">
                Real dads. Real conversations. No perfect answers.
              </p>
              <p style="margin-top:28px;font-size:12px;line-height:1.7;color:#52645A;">
                If you didn't register, or would like us to remove your
                details and stop program updates, reply and let us know.
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
        "Idempotency-Key": `interest-confirmation/${registrationId}`,
      },
      body: JSON.stringify({
        from,
        to: [email],
        reply_to: "hello@thedadclub.com.au",
        subject: "The Dad Club — your interest is registered",
        text,
        html,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(
        "Confirmation email: provider returned status",
        response.status,
      );
      return false;
    }

    const result: { id?: string } = await response.json();
    return typeof result.id === "string";
  } catch {
    console.error("Confirmation email: provider request failed.");
    return false;
  }
}