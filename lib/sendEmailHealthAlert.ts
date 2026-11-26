
import "server-only";

import {
  EMAIL_HEALTH_LABELS,
  EMAIL_HEALTH_ISSUE_LABELS,
  type EmailHealthType,
  type EmailHealthIssueType,
  type EmailHealthSeverity,
} from "./emailHealthTypes";

export type EmailHealthAlertItem = {
  email_type: EmailHealthType;
  issue_type: EmailHealthIssueType;
  severity: EmailHealthSeverity;
};

export type EmailHealthAlertPayload = {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  text: string;
  html: string;
};

export type EmailHealthAlertResult =
  | {
      status: "accepted";
      providerId: string;
      acceptedAt: string;
    }
  | {
      status: "pending" | "failed" | "not_confirmed";
      errorCode: string;
    };

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildEmailHealthAlertPayload(
  issues: EmailHealthAlertItem[],
): EmailHealthAlertPayload {
  const from = process.env.EMAIL_FROM?.trim();

  const recipient =
    process.env.ADMIN_NOTIFICATION_EMAIL?.trim();

  if (!from || !recipient) {
    throw new Error(
      "Email health alert configuration missing.",
    );
  }

  if (issues.length === 0) {
    throw new Error(
      "Email health alert contains no issues.",
    );
  }

  const total = issues.length;

  const critical = issues.filter(
    (issue) => issue.severity === "critical",
  ).length;

  const warnings = total - critical;

  const groups = new Map<string, number>();

  for (const issue of issues) {
    const emailLabel =
      EMAIL_HEALTH_LABELS[issue.email_type] ??
      "Automated email";

    const issueLabel =
      EMAIL_HEALTH_ISSUE_LABELS[issue.issue_type] ??
      "Requires review";

    const label = `${emailLabel} — ${issueLabel}`;

    groups.set(
      label,
      (groups.get(label) ?? 0) + 1,
    );
  }

  const summary = Array.from(groups.entries()).sort(
    ([first], [second]) =>
      first.localeCompare(second),
  );

  const dashboardUrl =
    "https://thedadclub.com.au/admin/emails";

  const subject =
    `The Dad Club — ${total} email ${
      total === 1
        ? "issue requires"
        : "issues require"
    } attention`;

  const text = [
    "Email issues require attention.",
    "",
    `${total} automated email or processor issues have been identified.`,
    "",
    `Critical: ${critical}`,
    `Warnings: ${warnings}`,
    "",
    ...summary.map(
      ([label, count]) => `${label}: ${count}`,
    ),
    "",
    "Some issues may represent an uncertain sending outcome rather than a confirmed delivery failure.",
    "",
    "Review the email health dashboard:",
    dashboardUrl,
    "",
    "Check the original sending outcome before attempting to resend an email.",
    "",
    "The Dad Club",
    "Automated administrator notification",
  ].join("\n");

  const rows = summary
    .map(
      ([label, count]) => `
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #D9DFD3;font-size:14px;line-height:1.6;">
            ${escapeHtml(label)}
          </td>
          <td style="padding:12px 16px;border-bottom:1px solid #D9DFD3;text-align:right;font-weight:bold;">
            ${count}
          </td>
        </tr>
      `,
    )
    .join("");

  const html = `
    <!doctype html>
    <html lang="en-AU">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>The Dad Club — Email Health Alert</title>
      </head>

      <body style="margin:0;padding:24px 12px;background:#F4F0E5;color:#173A2C;font-family:Inter,Arial,Helvetica,sans-serif;">

        <table role="presentation" style="width:100%;max-width:600px;margin:0 auto;border-collapse:collapse;">

          <tr>
            <td style="padding:28px;background:#173A2C;color:#F4F0E5;">
              <p style="margin:0;font-size:18px;font-weight:bold;">
                THE DAD CLUB
                <span style="color:#D6A17C;">&rarr;</span>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:32px 28px;background:#FBF8F0;">

              <p style="margin:0 0 16px;font-size:12px;font-weight:bold;letter-spacing:2px;color:#C96632;">
                ADMINISTRATOR ALERT
              </p>

              <h1 style="margin:0 0 24px;font-size:30px;line-height:1.2;">
                Email issues require attention.
              </h1>

              <p style="font-size:16px;line-height:1.7;">
                ${total} automated email or processor
                ${total === 1 ? "issue has" : "issues have"}
                been identified.
              </p>

              <table role="presentation" style="width:100%;margin:24px 0;background:#E8EBDD;border-collapse:collapse;">
                <tr>
                  <td style="width:50%;padding:20px;">
                    <p style="margin:0;font-size:28px;font-weight:bold;">
                      ${critical}
                    </p>
                    <p style="margin:6px 0 0;font-size:14px;">
                      Critical
                    </p>
                  </td>

                  <td style="width:50%;padding:20px;">
                    <p style="margin:0;font-size:28px;font-weight:bold;">
                      ${warnings}
                    </p>
                    <p style="margin:6px 0 0;font-size:14px;">
                      Warnings
                    </p>
                  </td>
                </tr>
              </table>

              <table role="presentation" style="width:100%;margin:24px 0;background:#E8EBDD;border-collapse:collapse;">
                ${rows}
              </table>

              <p style="font-size:15px;line-height:1.7;">
                Some issues may represent an uncertain
                sending outcome rather than a confirmed
                delivery failure.
              </p>

              <p style="margin:28px 0;">
                <a
                  href="${dashboardUrl}"
                  style="display:inline-block;padding:14px 22px;background:#173A2C;color:#F4F0E5;text-decoration:none;font-weight:bold;border-radius:4px;"
                >
                  Review email issues
                </a>
              </p>

              <p style="font-size:14px;line-height:1.7;color:#52645A;">
                Check the original sending outcome before
                attempting to resend an email.
              </p>

              <p style="margin:28px 0 8px;font-weight:bold;">
                The Dad Club
              </p>

              <p style="margin:0;font-size:13px;line-height:1.7;color:#52645A;">
                Automated administrator notification
              </p>

            </td>
          </tr>

        </table>

      </body>
    </html>
  `;

  return {
    from,
    to: [recipient],
    reply_to: "hello@thedadclub.com.au",
    subject,
    text,
    html,
  };
}

export async function sendEmailHealthAlert({
  alertId,
  body,
}: {
  alertId: string;
  body: string;
}): Promise<EmailHealthAlertResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    return {
      status: "pending",
      errorCode: "missing_api_configuration",
    };
  }

  if (!body.trim()) {
    return {
      status: "failed",
      errorCode: "invalid_payload",
    };
  }

  try {
    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key":
            `email-health-alert/${alertId}`,
        },
        body,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      console.error(
        "Email health alert: provider status.",
        response.status,
      );

      if (
        response.status === 408 ||
        response.status === 429 ||
        response.status >= 500
      ) {
        return {
          status: "pending",
          errorCode: `provider_${response.status}`,
        };
      }

      if (response.status === 409) {
        return {
          status: "not_confirmed",
          errorCode: "provider_409",
        };
      }

      return {
        status: "failed",
        errorCode: `provider_${response.status}`,
      };
    }

    const result: { id?: unknown } =
      await response.json();

    if (
      typeof result.id !== "string" ||
      !result.id.trim() ||
      result.id.length > 255
    ) {
      return {
        status: "pending",
        errorCode: "acceptance_unconfirmed",
      };
    }

    return {
      status: "accepted",
      providerId: result.id,
      acceptedAt: new Date().toISOString(),
    };
  } catch {
    console.error(
      "Email health alert: sending outcome uncertain.",
    );

    return {
      status: "pending",
      errorCode: "attempt_unconfirmed",
    };
  }
}
