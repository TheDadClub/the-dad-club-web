
import "server-only";

type NotificationInput = {
  eventId: string;
  eventType:
    | "venue_enquiry"
    | "interest_registration"
    | "facilitator_application";
};

export type AdminNotificationResult =
  | {
      status: "accepted";
      providerId: string;
      acceptedAt: string;
    }
  | {
      status: "failed" | "not_confirmed";
    };

const notifications = {
  venue_enquiry: {
    subject: "The Dad Club — New venue partnership enquiry",
    heading: "New venue partnership enquiry",
    message:
      "A venue has submitted a partnership enquiry through The Dad Club website.",
    path: "/admin/venues",
    button: "VIEW VENUE ENQUIRIES",
  },
  interest_registration: {
    subject: "The Dad Club — New interest registration",
    heading: "New interest registration",
    message:
      "A new interest registration has been submitted through The Dad Club website.",
    path: "/admin",
    button: "VIEW REGISTRATIONS",
  },
  facilitator_application: {
    subject: "The Dad Club — New facilitator application",
    heading: "New facilitator application",
    message:
      "A new facilitator application has been submitted through The Dad Club website.",
    path: "/admin/facilitators",
    button: "VIEW APPLICATIONS",
  },
} as const;

export async function sendAdminNotification({
  eventId,
  eventType,
}: NotificationInput): Promise<AdminNotificationResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const recipient = process.env.ADMIN_NOTIFICATION_EMAIL;

  if (!apiKey || !from || !recipient) {
    console.error(
      "Admin notification: missing email configuration.",
    );

    return { status: "failed" };
  }

  const notification = notifications[eventType];

  const dashboardUrl =
    `https://thedadclub.com.au${notification.path}`;

  const text = [
    notification.heading,
    "",
    notification.message,
    "",
    "Please sign in to the admin dashboard to review the details.",
    "",
    dashboardUrl,
    "",
    "The Dad Club — Administration",
    "",
    "This is an automated internal notification.",
  ].join("\n");

  const html = `
    <!doctype html>
    <html lang="en-AU">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport"
          content="width=device-width, initial-scale=1" />
        <title>${notification.subject}</title>
      </head>

      <body style="margin:0;padding:24px 12px;background:#F4F0E5;color:#173A2C;font-family:Inter,Arial,Helvetica,sans-serif;">

        <table role="presentation" style="width:100%;max-width:600px;margin:0 auto;border-collapse:collapse;">

          <tr>
            <td style="padding:28px;background:#173A2C;color:#F4F0E5;">
              <p style="margin:0;font-size:18px;font-weight:bold;">
                THE DAD CLUB
                <span style="color:#D6A17C;">&rarr;</span>
                ADMIN
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 28px;background:#FBF8F0;">

              <p style="margin:0 0 16px;font-size:12px;font-weight:bold;letter-spacing:2px;color:#C96632;">
                ADMIN NOTIFICATION
              </p>

              <h1 style="margin:0 0 24px;font-size:28px;line-height:1.2;">
                ${notification.heading}
              </h1>

              <p style="font-size:16px;line-height:1.7;">
                ${notification.message}
              </p>

              <p style="font-size:16px;line-height:1.7;">
                Please sign in to the admin dashboard
                to review the details.
              </p>

              <p style="margin:28px 0;">
                <a href="${dashboardUrl}"
                  style="display:inline-block;padding:16px 24px;background:#173A2C;color:#F4F0E5;text-decoration:none;border-radius:30px;font-size:13px;font-weight:bold;">
                  ${notification.button} &rarr;
                </a>
              </p>

              <p style="padding:18px;background:#E8EBDD;font-size:13px;line-height:1.6;">
                For privacy, personal and contact details
                are available only through the secure
                admin dashboard.
              </p>

              <p style="margin-top:28px;font-size:12px;color:#52645A;line-height:1.7;">
                This is an automated internal notification
                from The Dad Club.
              </p>

            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  try {
    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key":
            `admin-notification/${eventType}/${eventId}`,
        },
        body: JSON.stringify({
          from,
          to: [recipient],
          subject: notification.subject,
          text,
          html,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      console.error(
        "Admin notification: provider returned status",
        response.status,
      );

      return {
        status:
          response.status >= 500 ||
          response.status === 408 ||
          response.status === 409
            ? "not_confirmed"
            : "failed",
      };
    }

    const result: { id?: string } =
      await response.json();

    if (
      typeof result.id !== "string" ||
      !result.id
    ) {
      return { status: "not_confirmed" };
    }

    return {
      status: "accepted",
      providerId: result.id,
      acceptedAt: new Date().toISOString(),
    };
  } catch {
    console.error(
      "Admin notification: provider outcome not confirmed.",
    );

    return { status: "not_confirmed" };
  }
}
