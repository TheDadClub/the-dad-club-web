import "server-only";

import {
  purchasePackages,
  type PurchasePackage,
} from "./stripe";
import type { PurchaseKind } from "./createStripeCheckout";

type PurchaseConfirmationDetails = {
  orderId: string;
  email: string;
  name: string;
  packageCode: PurchasePackage;
  purchaseKind: PurchaseKind;
  giftCode: string | null;
  siteUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildPurchaseConfirmationEmail(
  details: PurchaseConfirmationDetails,
  from: string,
) {
  if (
    !Object.prototype.hasOwnProperty.call(
      purchasePackages,
      details.packageCode,
    )
  ) {
    throw new Error("Invalid purchase email details.");
  }

  const selected = purchasePackages[details.packageCode];
  const isGift = details.purchaseKind === "gift";
  const isHat = details.purchaseKind === "hat";

  if (
    !["self", "gift", "hat"].includes(details.purchaseKind) ||
    (isHat && details.packageCode !== "hat") ||
    (!isHat && details.packageCode === "hat") ||
    (isGift && !details.giftCode)
  ) {
    throw new Error("Invalid purchase email details.");
  }

  const packageName =
    details.packageCode === "before_baby"
      ? "Before Baby"
      : details.packageCode === "after_baby"
        ? "After Baby"
        : "The Dad Club Hat";

  const included =
    details.packageCode === "before_baby"
      ? "Five sessions: The Beginning, Getting Ready, Finding Your Feet, Adjusting and The Next Chapter. Includes one Dad Club hat and standard Australian delivery."
      : details.packageCode === "after_baby"
        ? "Three sessions: Finding Your Feet, Adjusting and The Next Chapter. Includes one Dad Club hat and standard Australian delivery."
        : "One forest-green Dad Club cap with an orange arrow. Standard delivery within Australia is included.";

  const amount = new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(selected.amount / 100);

  const heading = isGift
    ? "Something for the dad."
    : isHat
      ? "Good choice. Great headwear."
      : "Welcome to the club.";

  const introduction = isGift
    ? "Your Dad Club gift is ready to give. There may be plenty of gifts for the baby. This one makes room for the dad."
    : isHat
      ? "Thanks for ordering your Dad Club hat."
      : "Thanks for joining The Dad Club. Your program access is ready. A little support, a few honest conversations and room to find your feet.";

  const actionUrl = new URL(
    isGift ? "/redeem" : "/members/login",
    details.siteUrl,
  ).toString();

  const termsUrl = new URL(
    "/purchase/terms",
    details.siteUrl,
  ).toString();

  const privacyUrl = new URL(
    "/privacy/website",
    details.siteUrl,
  ).toString();

  const actionLabel = isGift
    ? "REDEEM A GIFT →"
    : "SIGN IN & CHOOSE YOUR DATES →";

  const instructions = isGift
    ? [
        "Give this certificate and its code to the dad when you're ready. We have not contacted him. The certificate has no expiry date and can be redeemed once for the stated package.",
        "He can redeem using his own email address, with no additional redemption payment. He provides his own Australian delivery address for the included hat.",
        "After redemption, he chooses suitable available published session dates. Online and face-to-face sessions have the same package price. The gift does not reserve specific dates or places.",
        "The included hat is dispatched within two business days after successful redemption and receipt of complete delivery details. Delivery takes additional time.",
      ]
    : isHat
      ? [
          "Your hat will be sent to the Australian delivery address supplied at checkout.",
          "We dispatch within two business days of purchase after successful payment and receipt of complete delivery details. Delivery takes additional time.",
          "This purchase is for the hat only and does not include program membership or session bookings.",
        ]
      : [
          "Sign in using the email address you supplied for this purchase. We'll send you a verification code.",
          "Choose suitable published dates in your member area, subject to available places. You can choose online or face-to-face sessions.",
          "Your purchase does not reserve specific dates. You will receive a separate confirmation for each session you book.",
          "Your included hat is dispatched within two business days of purchase after successful payment and receipt of complete delivery details. It will be sent to the Australian delivery address supplied at checkout. Delivery takes additional time.",
        ];

  instructions.push(
    "Business days are Monday to Friday, excluding public holidays in South Australia. If we cannot meet the dispatch timeframe, we will contact you to explain the delay and discuss your options.",
  );

  if (!isHat) {
    instructions.push(
      "Each session date needs at least six booked dads to go ahead. If we cancel because numbers are too low, the member can choose another suitable date or request a refund for the affected unused session.",
    );
  }

  const rows = [
    ["Purchase", packageName],
    ["Paid", `${amount} AUD`],
    ["Included", included],
    ...(isGift ? [["Gift validity", "No expiry date"]] : []),
    ["Order reference", details.orderId],
  ];

  const text = [
    heading,
    "",
    `Hi ${details.name},`,
    "",
    introduction,
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    ...(isGift
      ? [
          "GIFT REDEMPTION CODE",
          details.giftCode!,
          "No expiry date",
          "",
        ]
      : []),
    ...instructions.flatMap((paragraph) => [paragraph, ""]),
    ...(!isHat
      ? [
          `${isGift ? "Redeem the gift" : "Sign in"}: ${actionUrl}`,
          "",
        ]
      : []),
    `Purchase & Gift Terms: ${termsUrl}`,
    `Website privacy notice: ${privacyUrl}`,
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
        <title>The Dad Club — Purchase Confirmation</title>
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
                ${isGift ? "GIFT CERTIFICATE" : "PURCHASE CONFIRMED"}
              </p>

              <h1 style="margin:0 0 24px;font-size:30px;line-height:1.2;">
                ${escapeHtml(heading)}
              </h1>

              <p style="font-size:16px;line-height:1.7;">
                Hi ${escapeHtml(details.name)},
              </p>

              <p style="font-size:16px;line-height:1.7;">
                ${escapeHtml(introduction)}
              </p>

              <table role="presentation" style="width:100%;margin:24px 0;border-collapse:collapse;background:#E8EBDD;">
                ${rows
                  .map(
                    ([label, value]) => `
                      <tr>
                        <td style="padding:12px 16px;font-size:14px;vertical-align:top;font-weight:bold;">
                          ${escapeHtml(label)}
                        </td>
                        <td style="padding:12px 16px;font-size:14px;line-height:1.6;overflow-wrap:anywhere;">
                          ${escapeHtml(value)}
                        </td>
                      </tr>
                    `,
                  )
                  .join("")}
              </table>

              ${
                isGift
                  ? `
                    <div style="margin:24px 0;padding:24px;background:#173A2C;border-radius:16px;color:#F4F0E5;">
                      <p style="margin:0;font-size:11px;font-weight:bold;letter-spacing:2px;">
                        GIFT REDEMPTION CODE
                      </p>
                      <p style="margin:12px 0 0;font-family:monospace;font-size:20px;line-height:1.7;overflow-wrap:anywhere;">
                        ${escapeHtml(details.giftCode!)}
                      </p>
                      <p style="margin:16px 0 0;font-size:16px;font-weight:bold;">
                        No expiry date
                      </p>
                    </div>
                  `
                  : ""
              }

              ${instructions
                .map(
                  (paragraph) => `
                    <p style="font-size:16px;line-height:1.7;">
                      ${escapeHtml(paragraph)}
                    </p>
                  `,
                )
                .join("")}

              ${
                !isHat
                  ? `
                    <p style="margin:28px 0;">
                      <a href="${escapeHtml(actionUrl)}" style="display:inline-block;padding:16px 24px;background:#173A2C;color:#F4F0E5;text-decoration:none;border-radius:28px;font-size:14px;font-weight:bold;">
                        ${escapeHtml(actionLabel)}
                      </a>
                    </p>
                  `
                  : ""
              }

              <p style="font-size:13px;line-height:1.8;color:#52645A;">
                <a href="${escapeHtml(termsUrl)}" style="color:#173A2C;text-decoration:underline;">
                  Purchase &amp; Gift Terms
                </a>
                <br />
                <a href="${escapeHtml(privacyUrl)}" style="color:#173A2C;text-decoration:underline;">
                  Website privacy notice
                </a>
              </p>

              <p style="font-size:16px;line-height:1.7;">
                Need a hand? Reply to this email.
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
    subject: isGift
      ? `The Dad Club — Gift Certificate: ${packageName}`
      : `The Dad Club — Purchase Confirmed: ${packageName}`,
    text,
    html,
  };
}