import "server-only";

import { randomUUID } from "node:crypto";
import { createAdminDatabase } from "./admin";
import {
  purchaseTermsSections,
  purchaseTermsUpdated,
  purchaseTermsVersion,
} from "./purchaseTerms";
import {
  assertStripeEnvironment,
  getStripe,
  getStripeEnvironment,
  getStripePriceId,
  isStripeCheckoutEnabled,
  purchasePackages,
  type PurchasePackage,
} from "./stripe";

export type PurchaseKind = "self" | "gift" | "hat";

type CheckoutDetails = {
  packageCode: PurchasePackage;
  purchaseKind: PurchaseKind;
  name: string;
  email: string;
  termsAccepted: boolean;
  termsVersion: string;
};

export class CheckoutError extends Error {
  constructor(
    public readonly code:
      | "disabled"
      | "invalid"
      | "terms"
      | "member_exists"
      | "unavailable",
  ) {
    super("Checkout could not be started.");
    this.name = "CheckoutError";
  }
}

function checkoutBaseUrl() {
  const value = process.env.STRIPE_CHECKOUT_BASE_URL;

  if (!value) {
    throw new CheckoutError("unavailable");
  }

  const url = new URL(value);

  const local =
    ["localhost", "127.0.0.1"].includes(url.hostname) &&
    url.protocol === "http:";

  const production =
    url.hostname === "www.thedadclub.com.au" &&
    url.protocol === "https:";

  if (
    (!local && !production) ||
    (getStripeEnvironment() === "live" && !production) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    (production && url.port)
  ) {
    throw new CheckoutError("unavailable");
  }

  return url.origin;
}

export async function createStripeCheckout(
  details: CheckoutDetails,
): Promise<string> {
  if (!isStripeCheckoutEnabled()) {
    throw new CheckoutError("disabled");
  }

  if (
    details.termsAccepted !== true ||
    details.termsVersion !== purchaseTermsVersion
  ) {
    throw new CheckoutError("terms");
  }

  const environment = getStripeEnvironment();
  const termsAcceptedAt = new Date().toISOString();

  const name = details.name.trim();
  const email = details.email.trim().toLowerCase();

  const validKind =
    details.packageCode === "hat"
      ? details.purchaseKind === "hat"
      : ["self", "gift"].includes(details.purchaseKind);

  if (
    !validKind ||
    name.length < 1 ||
    name.length > 100 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    !Object.prototype.hasOwnProperty.call(
      purchasePackages,
      details.packageCode,
    )
  ) {
    throw new CheckoutError("invalid");
  }

  const selectedPackage = purchasePackages[details.packageCode];

  const baseUrl = checkoutBaseUrl();
  const stripe = getStripe();
  const priceId = getStripePriceId(details.packageCode);
  const price = await stripe.prices.retrieve(priceId);

  assertStripeEnvironment(price.livemode);

  if (
    !price.active ||
    price.type !== "one_time" ||
    price.currency !== "aud" ||
    price.unit_amount !== selectedPackage.amount
  ) {
    throw new CheckoutError("unavailable");
  }

  const database = createAdminDatabase();

  if (details.purchaseKind === "self") {
    const { data: existingMembers, error } = await database
      .from("members")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (error) {
      throw new CheckoutError("unavailable");
    }

    // Existing memberships need a separate upgrade/review flow.
    // Never reset used entitlements or reactivate archived access.
    if (existingMembers?.length) {
      throw new CheckoutError("member_exists");
    }
  }

  const orderId = randomUUID();

  const { error: orderError } = await database
    .from("purchase_orders")
    .insert({
      id: orderId,
      stripe_environment: environment,
      package_code: details.packageCode,
      purchase_kind: details.purchaseKind,
      currency: "aud",
      expected_amount: selectedPackage.amount,
      purchaser_name: name,
      purchaser_email: email,
      stripe_price_id: priceId,
      terms_version: purchaseTermsVersion,
      terms_accepted_at: termsAcceptedAt,
      terms_snapshot: {
        version: purchaseTermsVersion,
        lastUpdated: purchaseTermsUpdated,
        sections: purchaseTermsSections,
      },
    });

  if (orderError) {
    console.error("Checkout order creation failed.");
    throw new CheckoutError("unavailable");
  }

  try {
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        allowed_payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        client_reference_id: orderId,
        customer_email: email,
        automatic_tax: {
          enabled: false,
        },
        allow_promotion_codes: false,
        billing_address_collection: "auto",

        // Gift hat delivery is arranged at redemption.
        // Self-purchases and standalone hats collect it now.
        ...(details.purchaseKind !== "gift"
          ? {
              shipping_address_collection: {
                allowed_countries: ["AU" as const],
              },
            }
          : {}),

        metadata: {
          order_id: orderId,
          package_code: details.packageCode,
          purchase_kind: details.purchaseKind,
          terms_version: purchaseTermsVersion,
          stripe_environment: environment,
        },
        payment_intent_data: {
          metadata: {
            order_id: orderId,
          },
        },
        expires_at: Math.floor(Date.now() / 1000) + 60 * 60,
        success_url:
          `${baseUrl}/purchase/success` +
          "?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: `${baseUrl}/purchase?cancelled=1`,
      },
      {
        idempotencyKey: `purchase-checkout/${orderId}`,
      },
    );

    assertStripeEnvironment(session.livemode);

    if (
      !session.url ||
      session.amount_total !== selectedPackage.amount ||
      session.currency !== "aud"
    ) {
      throw new Error("Unexpected checkout configuration.");
    }

    const checkoutUrl = new URL(session.url);

    if (
      checkoutUrl.protocol !== "https:" ||
      checkoutUrl.hostname !== "checkout.stripe.com"
    ) {
      throw new Error("Unexpected checkout destination.");
    }

    const { data: savedOrder, error: saveError } = await database
      .from("purchase_orders")
      .update({
        stripe_checkout_session_id: session.id,
      })
      .eq("id", orderId)
      .eq("status", "awaiting_payment")
      .select("id")
      .maybeSingle();

    if (saveError || !savedOrder) {
      throw new Error("Checkout reference could not be saved.");
    }

    return session.url;
  } catch {
    // A network failure does not prove that Stripe failed
    // to create the session. Keep the order for reconciliation.
    const { error: reviewError } = await database
      .from("purchase_orders")
      .update({
        status: "review",
        review_code: "checkout_creation_unconfirmed",
      })
      .eq("id", orderId)
      .eq("status", "awaiting_payment");

    if (reviewError) {
      console.error("Checkout review status could not be saved.");
    }

    console.error("Checkout creation could not be confirmed.");
    throw new CheckoutError("unavailable");
  }
}