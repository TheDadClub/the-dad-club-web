import "server-only";

import { createAdminDatabase } from "./admin";
import {
  buildGiftCode,
  hashGiftCode,
} from "./giftCodes";
import { getStripeEnvironment } from "./stripe";

export type PurchaseFulfilmentStatus =
  | "fulfilled"
  | "review"
  | "refunded";

export async function fulfilPaidPurchase(
  orderId: string,
): Promise<PurchaseFulfilmentStatus> {
  const environment = getStripeEnvironment();
  const database = createAdminDatabase();

  const { data: order, error: orderError } = await database
    .from("purchase_orders")
    .select("purchase_kind, status, stripe_environment")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    throw new Error("Purchase could not be loaded.");
  }

  if (order.stripe_environment !== environment) {
    throw new Error(
      "Purchase does not match the configured payment mode.",
    );
  }

  let giftCodeHash: string | null = null;

  if (
    order.purchase_kind === "gift" &&
    order.status === "paid"
  ) {
    const code = buildGiftCode(orderId, environment);
    giftCodeHash = hashGiftCode(code);

    if (!giftCodeHash) {
      throw new Error("Gift code could not be prepared.");
    }
  }

  const { data, error } = await database.rpc(
    "fulfil_paid_purchase",
    {
      p_order_id: orderId,
      p_gift_code_hash: giftCodeHash,
    },
  );

  if (error) {
    throw new Error("Purchase fulfilment failed.");
  }

  const status =
    data !== null &&
    typeof data === "object" &&
    !Array.isArray(data)
      ? data.status
      : undefined;

  if (
    status !== "fulfilled" &&
    status !== "review" &&
    status !== "refunded"
  ) {
    throw new Error("Purchase fulfilment is incomplete.");
  }

  return status;
}