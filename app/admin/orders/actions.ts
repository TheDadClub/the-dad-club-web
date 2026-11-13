"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/admin";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function returnUrl(
  formData: FormData,
  outcome: "saved" | "error",
  code: string,
) {
  const params = new URLSearchParams();

  const status = field(formData, "filter_status");
  const kind = field(formData, "filter_kind");
  const environment = field(formData, "filter_environment");
  const page = field(formData, "filter_page");
  const orderId = field(formData, "order_id");

  if (
    [
      "awaiting_payment",
      "paid",
      "fulfilled",
      "review",
      "expired",
      "refunded",
    ].includes(status)
  ) {
    params.set("status", status);
  }

  if (["self", "gift", "hat"].includes(kind)) {
    params.set("kind", kind);
  }

  if (["sandbox", "live"].includes(environment)) {
    params.set("environment", environment);
  }

  if (/^\d{1,5}$/.test(page) && Number(page) > 1) {
    params.set("page", String(Math.min(10000, Number(page))));
  }

  params.set(outcome, code);

  if (uuidPattern.test(orderId)) {
    params.set("order", orderId);
  }

  const hash = uuidPattern.test(orderId)
    ? `#order-${orderId}`
    : "";

  return `/admin/orders?${params.toString()}${hash}`;
}

export async function dispatchPurchaseHat(formData: FormData) {
  const { user, database } = await requireAdmin();

  const orderId = field(formData, "order_id");
  const tracking = field(formData, "tracking_reference");
  const confirmed = field(formData, "confirm_dispatch") === "yes";

  if (
    !uuidPattern.test(orderId) ||
    tracking.length > 200 ||
    !confirmed
  ) {
    redirect(returnUrl(formData, "error", "invalid"));
  }

  let errorCode: string | null = null;

  try {
    const { data, error } = await database.rpc(
      "dispatch_purchase_hat",
      {
        p_order_id: orderId,
        p_actor_id: user.id,
        p_tracking_reference: tracking,
        p_confirm: true,
      },
    );

    if (error) {
      errorCode =
        error.message === "This hat order is not ready for dispatch."
          ? "changed"
          : error.message === "Delivery details require review."
            ? "address"
            : error.message === "Gift redemption is required before dispatch."
              ? "gift"
              : error.message === "Administrator access required."
                ? "access"
                : "unknown";

      console.error("Hat dispatch could not be recorded.");
    } else if (data !== orderId) {
      errorCode = "unknown";
    }
  } catch {
    errorCode = "unknown";
    console.error("Hat dispatch outcome is unavailable.");
  }

  revalidatePath("/admin/orders");

  if (errorCode) {
    redirect(returnUrl(formData, "error", errorCode));
  }

  redirect(returnUrl(formData, "saved", "dispatched"));
}