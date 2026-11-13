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

export async function reviewPurchaseRefund(formData: FormData) {
  const { user, database } = await requireAdmin();

  const orderId = field(formData, "order_id");
  const refundAt = field(formData, "refund_snapshot_at");
  const resolution = field(formData, "resolution");
  const accessDecision = field(formData, "access_decision");
  const hatDecision = field(formData, "hat_decision");
  const notes = field(formData, "notes");
  const confirmed = field(formData, "confirm_review") === "yes";

  if (
    !uuidPattern.test(orderId) ||
    refundAt.length > 64 ||
    !Number.isFinite(Date.parse(refundAt)) ||
    !["continue_order", "close_order"].includes(resolution) ||
    !["retain", "removed_manually", "not_applicable"].includes(
      accessDecision,
    ) ||
    !["hold", "release"].includes(hatDecision) ||
    notes.length < 10 ||
    notes.length > 2000 ||
    !confirmed
  ) {
    redirect(returnUrl(formData, "error", "review_invalid"));
  }

  let errorCode: string | null = null;

  try {
    const { data, error } = await database.rpc(
      "review_purchase_refund",
      {
        p_order_id: orderId,
        p_actor_id: user.id,
        p_expected_refund_at: refundAt,
        p_resolution: resolution,
        p_access_decision: accessDecision,
        p_hat_decision: hatDecision,
        p_notes: notes,
        p_confirm: true,
      },
    );

    if (error) {
      switch (error.message) {
        case "The refund record has changed. Refresh before reviewing.":
          errorCode = "review_changed";
          break;

        case "Wait until the pending refund is resolved.":
          errorCode = "review_pending";
          break;

        case "Archive the member and review active bookings before recording access as removed.":
        case "The linked membership is not active.":
        case "Record the linked membership decision.":
        case "There is no linked membership to review.":
          errorCode = "review_member";
          break;

        case "Delivery details require review.":
          errorCode = "review_delivery";
          break;

        case "Gift details require further review.":
          errorCode = "review_gift";
          break;

        case "Payment details require further review.":
        case "This order needs fulfilment assistance before it can continue.":
          errorCode = "review_support";
          break;

        case "Please complete the review details.":
        case "Closing requires a full refund and no further hat dispatch.":
        case "A fully refunded order cannot continue.":
          errorCode = "review_invalid";
          break;

        default:
          errorCode = "review_unknown";
      }

      console.error("Refund review could not be recorded.");
    } else if (data !== orderId) {
      errorCode = "review_unknown";
    }
  } catch {
    errorCode = "review_unknown";
    console.error("Refund review outcome is unavailable.");
  }

  revalidatePath("/admin/orders");

  if (errorCode) {
    redirect(returnUrl(formData, "error", errorCode));
  }

  redirect(returnUrl(formData, "saved", "reviewed"));
}