import "server-only";

import type Stripe from "stripe";
import { createAdminDatabase } from "./admin";
import { getStripe } from "./stripe";

type RefundResult = "ignored" | "recorded" | "review";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function processStripeRefund(
  event: Stripe.Event,
): Promise<RefundResult> {
  if (
    event.type !== "refund.created" &&
    event.type !== "refund.updated" &&
    event.type !== "refund.failed"
  ) {
    return "ignored";
  }

  if (event.livemode) {
    throw new Error("Live refund processing is not enabled.");
  }

  const notification = event.data.object;

  if (notification.object !== "refund" || !notification.id) {
    throw new Error("Invalid refund notification.");
  }

  const stripe = getStripe();

  // Retrieve current records rather than trusting an
  // older snapshot contained in a notification.
  const refund = await stripe.refunds.retrieve(notification.id);

  const chargeId =
    typeof refund.charge === "string"
      ? refund.charge
      : refund.charge?.id;

  if (!chargeId) {
    throw new Error("Refund charge reference is missing.");
  }

  const charge = await stripe.charges.retrieve(chargeId);

  const paymentIntentId =
    typeof charge.payment_intent === "string"
      ? charge.payment_intent
      : charge.payment_intent?.id;

  if (!paymentIntentId) {
    throw new Error("Refund payment reference is missing.");
  }

  const payment = await stripe.paymentIntents.retrieve(
    paymentIntentId,
  );

  const orderId = payment.metadata.order_id;

  // Ignore refunds for payments outside this integration.
  if (!orderId) {
    return "ignored";
  }

  if (!uuidPattern.test(orderId)) {
    throw new Error("Invalid refund order reference.");
  }

  const refundPaymentId =
    typeof refund.payment_intent === "string"
      ? refund.payment_intent
      : refund.payment_intent?.id;

  const latestChargeId =
    typeof payment.latest_charge === "string"
      ? payment.latest_charge
      : payment.latest_charge?.id;

  if (
    charge.livemode ||
    payment.livemode ||
    !charge.paid ||
    !charge.captured ||
    payment.status !== "succeeded" ||
    latestChargeId !== charge.id ||
    refundPaymentId !== payment.id ||
    payment.amount_received !== charge.amount ||
    charge.amount_captured !== charge.amount ||
    refund.currency !== charge.currency ||
    payment.currency !== charge.currency ||
    !Number.isSafeInteger(refund.amount) ||
    refund.amount <= 0 ||
    refund.amount > charge.amount ||
    !refund.status ||
    ![
      "pending",
      "requires_action",
      "succeeded",
      "failed",
      "canceled",
    ].includes(refund.status)
  ) {
    throw new Error("Refund verification failed.");
  }

  const database = createAdminDatabase();

  const { data, error } = await database.rpc(
    "record_stripe_refund",
    {
      p_event_id: event.id,
      p_event_type: event.type,
      p_event_created: event.created,
      p_order_id: orderId,
      p_refund_id: refund.id,
      p_charge_id: charge.id,
      p_payment_intent_id: payment.id,
      p_charge_amount: charge.amount,
      p_amount: refund.amount,
      p_currency: refund.currency,
      p_status: refund.status,
      p_livemode: charge.livemode,
      p_refund_created_at: new Date(
        refund.created * 1000,
      ).toISOString(),
    },
  );

  if (error || (data !== "recorded" && data !== "review")) {
    throw new Error("Refund recording failed.");
  }

  return data;
}