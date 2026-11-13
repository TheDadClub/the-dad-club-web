import "server-only";

import { createAdminDatabase } from "./admin";
import {
  buildGiftCode,
  hashGiftCode,
} from "./giftCodes";
import { buildPurchaseConfirmationEmail } from "./purchaseConfirmationEmail";
import { isPurchasePackage } from "./stripe";

export type PurchaseEmailOutcome =
  | "accepted"
  | "not_confirmed"
  | "skipped";

function emailSiteUrl() {
  const value = process.env.STRIPE_CHECKOUT_BASE_URL;

  if (!value) {
    throw new Error("Purchase website configuration is missing.");
  }

  const url = new URL(value);

  const local =
    ["localhost", "127.0.0.1"].includes(url.hostname) &&
    url.protocol === "http:";

  const production =
    url.hostname === "thedadclub.com.au" &&
    url.protocol === "https:" &&
    !url.port;

  if (
    (!local && !production) ||
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  ) {
    throw new Error("Invalid purchase website configuration.");
  }

  return url.origin;
}

export async function sendPurchaseConfirmation(
  orderId: string,
): Promise<PurchaseEmailOutcome> {
  const database = createAdminDatabase();

  // Claim before sending. Another notification cannot
  // claim this same pending email.
  const { data: claimed, error: claimError } = await database
    .from("purchase_confirmation_emails")
    .update({
      status: "not_confirmed",
      accepted_at: null,
      provider_id: null,
    })
    .eq("order_id", orderId)
    .eq("status", "pending")
    .select("order_id")
    .maybeSingle();

  if (claimError) {
    throw new Error("Purchase email claim failed.");
  }

  if (!claimed) {
    const { data: existing, error } = await database
      .from("purchase_confirmation_emails")
      .select("status")
      .eq("order_id", orderId)
      .maybeSingle();

    if (error || !existing) {
      throw new Error("Purchase email record unavailable.");
    }

    return existing.status === "accepted"
      ? "accepted"
      : existing.status === "skipped"
        ? "skipped"
        : "not_confirmed";
  }

  async function skip(): Promise<PurchaseEmailOutcome> {
    const { error } = await database
      .from("purchase_confirmation_emails")
      .update({
        status: "skipped",
        accepted_at: null,
        provider_id: null,
      })
      .eq("order_id", orderId)
      .eq("status", "not_confirmed");

    if (error) {
      console.error("Purchase email skip could not be recorded.");
      return "not_confirmed";
    }

    return "skipped";
  }

  try {
    const { data: order, error: orderError } = await database
      .from("purchase_orders")
      .select(
        "id, status, stripe_environment, package_code, purchase_kind, purchaser_name, purchaser_email, member_id, refunded_amount",
      )
      .eq("id", orderId)
      .maybeSingle();

    if (orderError || !order) {
      return "not_confirmed";
    }

    if (
      order.status !== "fulfilled" ||
      order.refunded_amount > 0
    ) {
      return skip();
    }

    if (
      order.stripe_environment !== "sandbox" ||
      !isPurchasePackage(order.package_code) ||
      !["self", "gift", "hat"].includes(order.purchase_kind)
    ) {
      return "not_confirmed";
    }

    const email = order.purchaser_email.trim().toLowerCase();

    if (
      email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return "not_confirmed";
    }

    let giftCode: string | null = null;

    if (order.purchase_kind === "gift") {
      const { data: gift, error: giftError } = await database
        .from("program_gifts")
        .select("code_hash, status, package_code")
        .eq("order_id", orderId)
        .maybeSingle();

      if (giftError || !gift) {
        return "not_confirmed";
      }

      if (gift.status !== "available") {
        return skip();
      }

      giftCode = buildGiftCode(orderId, "sandbox");

      if (
        gift.package_code !== order.package_code ||
        hashGiftCode(giftCode) !== gift.code_hash
      ) {
        return "not_confirmed";
      }
    }

    if (order.purchase_kind === "self") {
      if (!order.member_id) {
        return "not_confirmed";
      }

      const { data: member, error: memberError } = await database
        .from("members")
        .select("status, email")
        .eq("id", order.member_id)
        .maybeSingle();

      if (memberError || !member) {
        return "not_confirmed";
      }

      if (member.status !== "active") {
        return skip();
      }

      if (member.email !== email) {
        return "not_confirmed";
      }
    }

    const key = process.env.RESEND_API_KEY?.trim();
    const from = process.env.EMAIL_FROM?.trim();

    if (!key || !from) {
      return "not_confirmed";
    }

    const message = buildPurchaseConfirmationEmail(
      {
        orderId,
        email,
        name: order.purchaser_name,
        packageCode: order.package_code,
        purchaseKind:
          order.purchase_kind === "self"
            ? "self"
            : order.purchase_kind === "gift"
              ? "gift"
              : "hat",
        giftCode,
        siteUrl: emailSiteUrl(),
      },
      from,
    );

    // Recheck eligibility immediately before handing
    // the message to the email provider.
    const { data: latest, error: latestError } = await database
      .from("purchase_orders")
      .select("status, refunded_amount")
      .eq("id", orderId)
      .maybeSingle();

    if (latestError || !latest) {
      return "not_confirmed";
    }

    if (
      latest.status !== "fulfilled" ||
      latest.refunded_amount > 0
    ) {
      return skip();
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `purchase-confirmation/${orderId}`,
      },
      body: JSON.stringify(message),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return "not_confirmed";
    }

    const result: { id?: unknown } = await response.json();

    if (
      typeof result.id !== "string" ||
      !result.id.trim() ||
      result.id.length > 255
    ) {
      return "not_confirmed";
    }

    const { data: recorded, error: recordError } = await database
      .from("purchase_confirmation_emails")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
        provider_id: result.id,
      })
      .eq("order_id", orderId)
      .eq("status", "not_confirmed")
      .select("order_id")
      .maybeSingle();

    if (recordError || !recorded) {
      console.error(
        "Purchase email acceptance could not be recorded.",
      );
      return "not_confirmed";
    }

    return "accepted";
  } catch {
    console.error("Purchase email outcome could not be confirmed.");
    return "not_confirmed";
  }
}