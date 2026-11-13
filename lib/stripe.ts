import "server-only";

import Stripe from "stripe";

export type PurchasePackage =
  | "before_baby"
  | "after_baby"
  | "hat";

export const purchasePackages = {
  before_baby: {
    name: "The Dad Club — Before Baby",
    amount: 24_900,
    sessions: [1, 2, 3, 4, 5],
    includesHat: true,
  },
  after_baby: {
    name: "The Dad Club — After Baby",
    amount: 17_900,
    sessions: [3, 4, 5],
    includesHat: true,
  },
  hat: {
    name: "The Dad Club Hat",
    amount: 6_500,
    sessions: [],
    includesHat: true,
  },
} as const;

let stripeClient: Stripe | undefined;

export function isPurchasePackage(
  value: string,
): value is PurchasePackage {
  return Object.prototype.hasOwnProperty.call(
    purchasePackages,
    value,
  );
}

export function isStripeCheckoutEnabled() {
  return process.env.STRIPE_CHECKOUT_ENABLED === "true";
}

export function getStripe() {
  if (stripeClient) {
    return stripeClient;
  }

  const secret = process.env.STRIPE_SECRET_KEY?.trim();

  if (!secret || !secret.startsWith("sk_test_")) {
    throw new Error(
      "A Stripe sandbox secret key is required.",
    );
  }

  stripeClient = new Stripe(secret, {
    maxNetworkRetries: 2,
    timeout: 15_000,
  });

  return stripeClient;
}

export function getStripePriceId(
  packageCode: PurchasePackage,
) {
  const prices: Record<PurchasePackage, string | undefined> = {
    before_baby: process.env.STRIPE_PRICE_BEFORE_BABY,
    after_baby: process.env.STRIPE_PRICE_AFTER_BABY,
    hat: process.env.STRIPE_PRICE_HAT,
  };

  const priceId = prices[packageCode]?.trim();

  if (!priceId || !/^price_[A-Za-z0-9]+$/.test(priceId)) {
    throw new Error(
      "Stripe package pricing is not configured.",
    );
  }

  return priceId;
}