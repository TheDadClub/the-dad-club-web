"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminDatabase } from "../../lib/admin";
import { createAuthClient } from "../../lib/supabase/server";
import { hashGiftCode } from "../../lib/giftCodes";
import {
  clearPendingGiftRedemption,
  readPendingGiftRedemption,
  savePendingGiftRedemption,
} from "../../lib/pendingGiftRedemption";

function field(formData: FormData, name: string) {
  const values = formData.getAll(name);

  if (values.length !== 1 || typeof values[0] !== "string") {
    return "";
  }

  return values[0].trim();
}

async function verifiedForm(formData: FormData) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const token = field(formData, "cf-turnstile-response");
  const origin = (await headers()).get("origin");

  if (!secret || !token || token.length > 2048 || !origin) {
    return false;
  }

  try {
    const configured = new URL(
      process.env.STRIPE_CHECKOUT_BASE_URL ?? "",
    );

    if (origin !== configured.origin) {
      return false;
    }

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
      result.action === "gift_redemption" &&
      result.hostname === configured.hostname
    );
  } catch {
    return false;
  }
}

async function prepareRedemption(formData: FormData) {
  if (process.env.GIFT_REDEMPTION_ENABLED !== "true") {
    return "disabled";
  }

  const codeHash = hashGiftCode(field(formData, "giftCode"));
  const name = field(formData, "name");
  const email = field(formData, "email").toLowerCase();
  const confirmation =
    field(formData, "emailConfirmation").toLowerCase();

  const line1 = field(formData, "addressLine1");
  const line2 = field(formData, "addressLine2");
  const city = field(formData, "city");
  const state = field(formData, "state");
  const postcode = field(formData, "postcode");

  if (
    !codeHash ||
    name.length < 1 ||
    name.length > 100 ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email !== confirmation ||
    line1.length < 1 ||
    line1.length > 200 ||
    line2.length > 200 ||
    city.length < 1 ||
    city.length > 100 ||
    !["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"].includes(
      state,
    ) ||
    !/^[0-9]{4}$/.test(postcode) ||
    field(formData, "detailsConfirmed") !== "yes" ||
    field(formData, "website")
  ) {
    return "invalid";
  }

  if (!(await verifiedForm(formData))) {
    return "verification";
  }

  const database = createAdminDatabase();

  const { data: gift, error: giftError } = await database
    .from("program_gifts")
    .select("order_id, status")
    .eq("code_hash", codeHash)
    .maybeSingle();

  if (giftError) {
    return "unavailable";
  }

  if (!gift || gift.status !== "available") {
    return "gift";
  }

  const { data: order, error: orderError } = await database
    .from("purchase_orders")
    .select("status, purchase_kind, stripe_environment, refunded_amount")
    .eq("id", gift.order_id)
    .maybeSingle();

  if (orderError) {
    return "unavailable";
  }

  if (
    !order ||
    order.status !== "fulfilled" ||
    order.purchase_kind !== "gift" ||
    order.stripe_environment !== "sandbox" ||
    order.refunded_amount !== 0
  ) {
    return "gift";
  }

  await savePendingGiftRedemption({
    codeHash,
    name,
    email,
    shipping: {
      name,
      address: {
        line1,
        line2,
        city,
        state,
        postal_code: postcode,
        country: "AU",
      },
    },
  });

  const auth = await createAuthClient();

  const { error } = await auth.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });

  if (error) {
    await clearPendingGiftRedemption();
    return "unavailable";
  }

  return "verify";
}

export async function requestGiftRedemption(formData: FormData) {
  let result = "unavailable";

  try {
    result = await prepareRedemption(formData);
  } catch {
    console.error("Gift verification could not be started.");
  }

  // Redirect outside the try/catch: Next.js redirects throw.
  if (result === "verify") {
    redirect("/redeem?step=verify");
  }

  redirect(`/redeem?error=${encodeURIComponent(result)}`);
}

async function completeRedemption(formData: FormData) {
  if (process.env.GIFT_REDEMPTION_ENABLED !== "true") {
    return "disabled";
  }

  const pending = await readPendingGiftRedemption();

  if (!pending) {
    return "expired";
  }

  const code = field(formData, "verificationCode").replace(/\s/g, "");

  if (!/^\d{6,10}$/.test(code)) {
    return "code";
  }

  if (!(await verifiedForm(formData))) {
    return "verification";
  }

  const auth = await createAuthClient();

  let {
    data: { user },
  } = await auth.auth.getUser();

  // A matching, verified session also allows a safe retry
  // if redemption failed after the OTP was consumed.
  const alreadyVerified =
    user?.email_confirmed_at &&
    user.email?.trim().toLowerCase() === pending.email;

  if (!alreadyVerified) {
    const { error } = await auth.auth.verifyOtp({
      email: pending.email,
      token: code,
      type: "email",
    });

    if (error) {
      return "code";
    }

    const current = await auth.auth.getUser();

    if (current.error) {
      return "unavailable";
    }

    user = current.data.user;
  }

  if (
    !user ||
    !user.email_confirmed_at ||
    user.email?.trim().toLowerCase() !== pending.email
  ) {
    return "code";
  }

  const database = createAdminDatabase();

  const { data: memberId, error } = await database.rpc(
    "redeem_program_gift",
    {
      p_code_hash: pending.codeHash,
      p_auth_user_id: user.id,
      p_name: pending.name,
      p_shipping_details: pending.shipping,
    },
  );

  if (error) {
    if (error.message === "Existing membership requires assistance.") {
      return "membership";
    }

    if (error.message === "Gift is not available to redeem.") {
      return "gift";
    }

    console.error("Gift redemption could not be completed.");
    return "unavailable";
  }

  if (
    typeof memberId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      memberId,
    )
  ) {
    return "unavailable";
  }

  await clearPendingGiftRedemption();
  return "complete";
}

export async function verifyGiftRedemption(formData: FormData) {
  let result = "unavailable";

  try {
    result = await completeRedemption(formData);
  } catch {
    console.error("Gift redemption outcome is unavailable.");
  }

  if (result === "complete") {
    redirect("/members");
  }

  if (
    result === "expired" ||
    result === "disabled" ||
    result === "gift" ||
    result === "membership"
  ) {
    redirect(`/redeem?error=${encodeURIComponent(result)}`);
  }

  redirect(
    `/redeem?step=verify&error=${encodeURIComponent(result)}`,
  );
}

export async function restartGiftRedemption() {
  await clearPendingGiftRedemption();
  redirect("/redeem");
}