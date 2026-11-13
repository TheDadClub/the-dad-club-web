import { NextRequest, NextResponse } from "next/server";
import {
  CheckoutError,
  createStripeCheckout,
  type PurchaseKind,
} from "../../../lib/createStripeCheckout";
import {
  isStripeCheckoutEnabled,
  type PurchasePackage,
} from "../../../lib/stripe";

export const maxDuration = 120;

const maximumBodyBytes = 16_384;

const selections: Record<
  string,
  {
    packageCode: PurchasePackage;
    purchaseKind: PurchaseKind;
  }
> = {
  before_baby_self: {
    packageCode: "before_baby",
    purchaseKind: "self",
  },
  after_baby_self: {
    packageCode: "after_baby",
    purchaseKind: "self",
  },
  before_baby_gift: {
    packageCode: "before_baby",
    purchaseKind: "gift",
  },
  after_baby_gift: {
    packageCode: "after_baby",
    purchaseKind: "gift",
  },
  hat: {
    packageCode: "hat",
    purchaseKind: "hat",
  },
};

function redirectToForm(
  request: NextRequest,
  status: string,
) {
  const url = new URL("/purchase", request.url);
  url.searchParams.set("status", status);
  url.hash = "purchase-form";

  const response = NextResponse.redirect(url, 303);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");

  return response;
}

async function readForm(request: NextRequest) {
  const contentType =
    request.headers.get("content-type") ?? "";

  if (
    !contentType
      .toLowerCase()
      .startsWith("application/x-www-form-urlencoded")
  ) {
    throw new Error("Unsupported form encoding.");
  }

  const contentLength = Number(
    request.headers.get("content-length"),
  );

  if (
    Number.isFinite(contentLength) &&
    contentLength > maximumBodyBytes
  ) {
    throw new Error("Form too large.");
  }

  if (!request.body) {
    throw new Error("Missing form.");
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();

  let size = 0;
  let body = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      size += value.byteLength;

      if (size > maximumBodyBytes) {
        await reader.cancel();
        throw new Error("Form too large.");
      }

      body += decoder.decode(value, { stream: true });
    }

    body += decoder.decode();
  } finally {
    reader.releaseLock();
  }

  return new URLSearchParams(body);
}

async function verifyTurnstile(
  token: string,
  hostname: string,
) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret || !token || token.length > 2048) {
    return false;
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret,
          response: token,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) return false;

    const result: {
      success?: boolean;
      action?: string;
      hostname?: string;
    } = await response.json();

    return (
      result.success === true &&
      result.action === "purchase_checkout" &&
      result.hostname === hostname
    );
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");

  let configuredOrigin: string;

  try {
    configuredOrigin = new URL(
      process.env.STRIPE_CHECKOUT_BASE_URL ?? "",
    ).origin;
  } catch {
    return new NextResponse("Checkout unavailable.", {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (
    origin !== configuredOrigin ||
    requestUrl.origin !== configuredOrigin
  ) {
    return new NextResponse("Forbidden.", {
      status: 403,
      headers: { "Cache-Control": "no-store" },
    });
  }

  if (!isStripeCheckoutEnabled()) {
    return redirectToForm(request, "disabled");
  }

  let data: URLSearchParams;

  try {
    data = await readForm(request);
  } catch {
    return redirectToForm(request, "invalid");
  }

  const fields = new Set([
    "selection",
    "name",
    "email",
    "emailConfirmation",
    "website",
    "detailsConfirmed",
    "cf-turnstile-response",
  ]);

  for (const key of data.keys()) {
    if (!fields.has(key) || data.getAll(key).length !== 1) {
      return redirectToForm(request, "invalid");
    }
  }

  const field = (name: string) =>
    (data.get(name) ?? "").trim();

  const selectionKey = field("selection");

  if (
    !Object.prototype.hasOwnProperty.call(
      selections,
      selectionKey,
    ) ||
    field("website")
  ) {
    return redirectToForm(request, "invalid");
  }

  const name = field("name");
  const email = field("email").toLowerCase();
  const emailConfirmation =
    field("emailConfirmation").toLowerCase();

  if (
    name.length < 1 ||
    name.length > 100 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email !== emailConfirmation ||
    field("detailsConfirmed") !== "yes"
  ) {
    return redirectToForm(request, "invalid");
  }

  const verified = await verifyTurnstile(
    field("cf-turnstile-response"),
    requestUrl.hostname,
  );

  if (!verified) {
    return redirectToForm(request, "verification");
  }

  try {
    const checkoutUrl = await createStripeCheckout({
      ...selections[selectionKey],
      name,
      email,
    });

    const response = NextResponse.redirect(checkoutUrl, 303);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");

    return response;
  } catch (error) {
    const status =
      error instanceof CheckoutError
        ? error.code
        : "unavailable";

    console.error("Purchase checkout could not be opened.");
    return redirectToForm(request, status);
  }
}