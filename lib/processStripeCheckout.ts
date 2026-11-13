import "server-only";

import type Stripe from "stripe";
import { createAdminDatabase } from "./admin";
import { fulfilPaidPurchase } from "./fulfilPurchase";
import { sendPurchaseConfirmation } from "./sendPurchaseConfirmation";
import { getStripe } from "./stripe";

type ProcessingResult =
  | "ignored"
  | "unpaid"
  | "fulfilled"
  | "refunded"
  | "review";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function record(value: unknown): Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown, maximum: number) {
  return typeof value === "string"
    ? value.trim().slice(0, maximum)
    : "";
}

function shippingDetails(session: Stripe.Checkout.Session) {
  const data = record(session);
  const collected = record(data.collected_information);

  const shipping = record(
    collected.shipping_details ?? data.shipping_details,
  );

  const address = record(shipping.address);

  if (Object.keys(shipping).length === 0) {
    return null;
  }

  return {
    name: text(shipping.name, 200),
    address: {
      line1: text(address.line1, 200),
      line2: text(address.line2, 200),
      city: text(address.city, 100),
      state: text(address.state, 100),
      postal_code: text(address.postal_code, 30),
      country: text(address.country, 2),
    },
  };
}

export async function processStripeCheckout(
  event: Stripe.Event,
): Promise<ProcessingResult> {
  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return "ignored";
  }

  if (event.livemode) {
    throw new Error("Live payments are not enabled.");
  }

  const notification = event.data.object;

  if (
    notification.object !== "checkout.session" ||
    !notification.id
  ) {
    throw new Error("Invalid checkout notification.");
  }

  const stripe = getStripe();

  const session = await stripe.checkout.sessions.retrieve(
    notification.id,
  );

  if (session.livemode || session.mode !== "payment") {
    throw new Error("Unexpected checkout environment or mode.");
  }

  const orderId = session.metadata?.order_id;

  if (!orderId) {
    return "ignored";
  }

  if (
    !uuidPattern.test(orderId) ||
    session.client_reference_id !== orderId
  ) {
    throw new Error("Checkout order reference mismatch.");
  }

  if (session.payment_status !== "paid") {
    return "unpaid";
  }

  if (session.status !== "complete") {
    throw new Error("Paid checkout is not complete.");
  }

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;

  if (
    !paymentIntentId ||
    !Number.isSafeInteger(session.amount_total) ||
    !session.currency
  ) {
    throw new Error("Paid checkout details are incomplete.");
  }

  const items = await stripe.checkout.sessions.listLineItems(
    session.id,
    { limit: 2 },
  );

  if (
    items.has_more ||
    items.data.length !== 1 ||
    !items.data[0].price?.id
  ) {
    throw new Error("Unexpected checkout line items.");
  }

  const payment = await stripe.paymentIntents.retrieve(
    paymentIntentId,
  );

  if (
    payment.livemode ||
    payment.status !== "succeeded" ||
    payment.amount_received !== session.amount_total ||
    payment.currency !== session.currency ||
    payment.metadata.order_id !== orderId
  ) {
    throw new Error("Payment verification failed.");
  }

  const item = items.data[0];
  const database = createAdminDatabase();

  const { data, error } = await database.rpc(
    "record_stripe_payment",
    {
      p_event_id: event.id,
      p_event_type: event.type,
      p_order_id: orderId,
      p_checkout_session_id: session.id,
      p_payment_intent_id: paymentIntentId,
      p_price_id: item.price!.id,
      p_quantity: item.quantity ?? 0,
      p_amount: session.amount_total,
      p_currency: session.currency,
      p_livemode: session.livemode,
      p_customer_email:
        session.customer_details?.email ??
        session.customer_email ??
        "",
      p_shipping_details: shippingDetails(session),
    },
  );

  if (error) {
    throw new Error("Payment recording failed.");
  }

  if (data === "review" || data === "refunded") {
    return data;
  }

  if (data !== "paid" && data !== "fulfilled") {
    throw new Error("Unexpected payment processing result.");
  }

  const result = await fulfilPaidPurchase(orderId);

  if (result === "fulfilled") {
    const emailOutcome = await sendPurchaseConfirmation(orderId);

    if (emailOutcome === "not_confirmed") {
      console.error(
        "Purchase confirmation email requires review:",
        orderId,
      );
    }
  }

  return result;
}