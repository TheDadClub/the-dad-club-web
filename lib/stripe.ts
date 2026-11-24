import "server-only";

import Stripe from "stripe";

export type StripeEnvironment = "sandbox" | "live";

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

let cachedStripe:
  | {
      secret: string;
      client: Stripe;
    }
  | undefined;

export function getStripeEnvironment(): StripeEnvironment {
  const configured = (
    process.env.STRIPE_MODE ?? "sandbox"
  ).trim();

  if (configured === "sandbox" || configured === "live") {
    return configured;
  }

  throw new Error(
    "STRIPE_MODE must be sandbox or live.",
  );
}

export function isStripeLiveMode() {
  return getStripeEnvironment() === "live";
}

export function assertStripeEnvironment(livemode: boolean) {
  if (livemode !== isStripeLiveMode()) {
    throw new Error(
      "Stripe data does not match the configured payment mode.",
    );
  }
}

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
  const environment = getStripeEnvironment();
  const secret = process.env.STRIPE_SECRET_KEY?.trim();

  const requiredPrefix =
    environment === "live" ? "sk_live_" : "sk_test_";

  if (!secret || !secret.startsWith(requiredPrefix)) {
    throw new Error(
      environment === "live"
        ? "A Stripe live secret key is required for live mode."
        : "A Stripe sandbox secret key is required for sandbox mode.",
    );
  }

  if (cachedStripe?.secret === secret) {
    return cachedStripe.client;
  }

  const client = new Stripe(secret, {
    maxNetworkRetries: 2,
    timeout: 15_000,
  });

  cachedStripe = {
    secret,
    client,
  };

  return client;
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