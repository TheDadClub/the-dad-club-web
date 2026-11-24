import type Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";
import {
  assertStripeEnvironment,
  getStripe,
} from "../../../../lib/stripe";
import { processStripeCheckout } from "../../../../lib/processStripeCheckout";
import { processStripeRefund } from "../../../../lib/processStripeRefund";

export const maxDuration = 120;

const maximumBodyBytes = 262_144;

function json(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

async function readRawBody(request: NextRequest) {
  const declaredLength = Number(
    request.headers.get("content-length"),
  );

  if (
    Number.isFinite(declaredLength) &&
    declaredLength > maximumBodyBytes
  ) {
    throw new Error("Request too large.");
  }

  if (!request.body) {
    throw new Error("Missing request body.");
  }

  const reader = request.body.getReader();
  const chunks: Buffer[] = [];
  let size = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      size += value.byteLength;

      if (size > maximumBodyBytes) {
        await reader.cancel();
        throw new Error("Request too large.");
      }

      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }

  return Buffer.concat(chunks);
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!secret?.startsWith("whsec_")) {
    return json(
      { error: "Payment notifications are not configured." },
      503,
    );
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature || signature.length > 4096) {
    return json({ error: "Invalid notification." }, 400);
  }

  let stripe: ReturnType<typeof getStripe>;

  try {
    stripe = getStripe();
  } catch {
    return json(
      { error: "Payment processing is not configured." },
      503,
    );
  }

  let body: Buffer;

  try {
    body = await readRawBody(request);
  } catch {
    return json({ error: "Invalid notification body." }, 400);
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      secret,
    );
  } catch {
    return json(
      { error: "Invalid notification signature." },
      400,
    );
  }

  try {
    assertStripeEnvironment(event.livemode);
  } catch {
    return json(
      {
        error:
          "Notification does not match the configured payment mode.",
      },
      400,
    );
  }

  // Continue processing existing payments and refunds even
  // when starting new checkouts has been disabled.
  try {
    const result = event.type.startsWith("refund.")
      ? await processStripeRefund(event)
      : await processStripeCheckout(event);

    if (result === "review") {
      console.error(
        "Stripe notification requires review:",
        event.id,
      );
    }

    return json({ received: true });
  } catch {
    console.error(
      "Stripe notification processing failed:",
      event.id,
    );

    return json(
      { error: "Payment processing could not be completed." },
      500,
    );
  }
}