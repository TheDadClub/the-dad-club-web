import Link from "next/link";
import { requireAdmin } from "../lib/admin";
import PurchaseOrderCard, {
  type PurchaseOrder,
  type OrderEmail,
  type OrderGift,
  type OrderRefund,
  type OrderAction,
} from "./PurchaseOrderCard";

export type OrderSearchParams = Promise<{
  status?: string | string[];
  kind?: string | string[];
  environment?: string | string[];
  page?: string | string[];
  saved?: string | string[];
  error?: string | string[];
  order?: string | string[];
}>;

const statuses = [
  ["awaiting_payment", "Awaiting payment"],
  ["paid", "Payment recorded"],
  ["fulfilled", "Access / order prepared"],
  ["review", "Needs review"],
  ["expired", "Expired checkout"],
  ["refunded", "Refunded — order closed"],
] as const;

const kinds = [
  ["self", "Own program"],
  ["gift", "Gift"],
  ["hat", "Standalone hat"],
] as const;

const errors: Record<string, string> = {
  invalid: "Please check the dispatch details and confirmation box.",
  changed:
    "This hat is no longer ready for dispatch. Check its current status and any refund review.",
  address: "Delivery details need checking before dispatch.",
  gift: "Gift redemption is required before dispatch.",
  access: "Administrator access could not be verified.",
  unknown:
    "We couldn't confirm the dispatch result. Check the current hat status before trying again.",
  review_invalid:
    "Please complete the review fields. A fully refunded order must be closed without approving further hat dispatch.",
  review_changed:
    "The refund record changed after this page loaded. Refresh and review the latest position.",
  review_pending:
    "Wait until Stripe resolves the pending refund before completing review.",
  review_member:
    "Check the membership decision. To record access as removed, archive the member and resolve active bookings first.",
  review_delivery: "Delivery details require review.",
  review_gift: "Gift details require further review.",
  review_support:
    "This order needs payment or fulfilment assistance before this review can be completed.",
  review_unknown:
    "We couldn't confirm the review result. Check the order's current status and history before trying again.",
};

const pageSize = 20;

const selectClass =
  "mt-2 w-full rounded-xl border border-[#173A2C]/20 bg-[#FBF8F0] px-4 py-3 text-sm";

const orderFields =
  "id, created_at, stripe_environment, package_code, purchase_kind, purchaser_name, purchaser_email, expected_amount, paid_amount, refunded_amount, refund_review_required, refund_updated_at, refund_resolution, refund_reviewed_at, status, paid_at, fulfilled_at, member_id, hat_status, hat_dispatched_at, hat_tracking_reference, shipping_details, review_code, stripe_checkout_session_id, stripe_payment_intent_id";

function scalar(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function groupByOrder<T extends { order_id: string }>(rows: T[]) {
  const grouped = new Map<string, T[]>();

  for (const row of rows) {
    const list = grouped.get(row.order_id) ?? [];
    list.push(row);
    grouped.set(row.order_id, list);
  }

  return grouped;
}

export default async function PurchaseOrders({
  searchParams,
}: {
  searchParams: OrderSearchParams;
}) {
  const { database } = await requireAdmin();
  const params = await searchParams;

  const rawStatus = scalar(params.status);
  const rawKind = scalar(params.kind);
  const rawEnvironment = scalar(params.environment);
  const rawPage = scalar(params.page);
  const errorCode = scalar(params.error);
  const selectedOrder = scalar(params.order);
  const saved = scalar(params.saved);

  const status = statuses.some(([value]) => value === rawStatus)
    ? rawStatus
    : "";

  const kind = kinds.some(([value]) => value === rawKind)
    ? rawKind
    : "";

  const environment =
    rawEnvironment === "sandbox" || rawEnvironment === "live"
      ? rawEnvironment
      : "";

  const page = /^\d{1,5}$/.test(rawPage)
    ? Math.max(1, Math.min(10000, Number(rawPage)))
    : 1;

  const errorMessage = Object.prototype.hasOwnProperty.call(
    errors,
    errorCode,
  )
    ? errors[errorCode]
    : undefined;

  const filters = { status, kind, environment, page };

  function listHref(nextPage: number) {
    const query = new URLSearchParams();

    if (status) query.set("status", status);
    if (kind) query.set("kind", kind);
    if (environment) query.set("environment", environment);
    if (nextPage > 1) query.set("page", String(nextPage));

    return `/admin/orders${query.size ? `?${query}` : ""}`;
  }

  let query = database
    .from("purchase_orders")
    .select(orderFields, { count: "exact" });

  if (status) query = query.eq("status", status);
  if (kind) query = query.eq("purchase_kind", kind);
  if (environment) {
    query = query.eq("stripe_environment", environment);
  }

  const result = await query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (result.error) {
    throw new Error("Unable to load purchase orders.");
  }

  const orders = (result.data ?? []) as PurchaseOrder[];
  const count = result.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const orderIds = orders.map((order) => order.id);

  const emails = new Map<string, OrderEmail>();
  const gifts = new Map<string, OrderGift>();

  let refunds = new Map<string, OrderRefund[]>();
  let actions = new Map<string, OrderAction[]>();
  let detailsUnavailable = false;

  if (orderIds.length > 0) {
    const [emailResult, giftResult, refundResult, actionResult] =
      await Promise.all([
        database
          .from("purchase_confirmation_emails")
          .select("order_id, status, accepted_at")
          .in("order_id", orderIds),

        database
          .from("program_gifts")
          .select("order_id, status, redeemed_at")
          .in("order_id", orderIds),

        database
          .from("purchase_refunds")
          .select(
            "order_id, stripe_refund_id, amount, status, stripe_created_at",
          )
          .in("order_id", orderIds)
          .order("stripe_created_at", { ascending: false })
          .limit(1000),

        database
          .from("purchase_order_actions")
          .select(
            "id, order_id, actor_id, action, created_at, notes, details",
          )
          .in("order_id", orderIds)
          .order("created_at", { ascending: false })
          .order("id", { ascending: false })
          .limit(100),
      ]);

    detailsUnavailable = Boolean(
      emailResult.error ||
      giftResult.error ||
      refundResult.error ||
      actionResult.error ||
      (refundResult.data?.length ?? 0) >= 1000,
    );

    for (const email of (emailResult.data ?? []) as OrderEmail[]) {
      emails.set(email.order_id, email);
    }

    for (const gift of (giftResult.data ?? []) as OrderGift[]) {
      gifts.set(gift.order_id, gift);
    }

    refunds = groupByOrder(
      (refundResult.data ?? []) as OrderRefund[],
    );

    actions = groupByOrder(
      (actionResult.data ?? []) as OrderAction[],
    );
  }

  let filteredSaveMessage = "";

  const validSelectedOrder =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      selectedOrder,
    );

  // A resolved order may disappear from a "Needs review"
  // filter. Verify its saved state before showing feedback.
  if (
    validSelectedOrder &&
    (saved === "reviewed" || saved === "dispatched") &&
    !orderIds.includes(selectedOrder)
  ) {
    const { data: savedOrder, error } = await database
      .from("purchase_orders")
      .select(
        "hat_status, refund_review_required, refund_reviewed_at",
      )
      .eq("id", selectedOrder)
      .maybeSingle();

    if (!error && savedOrder) {
      if (
        saved === "reviewed" &&
        !savedOrder.refund_review_required &&
        savedOrder.refund_reviewed_at
      ) {
        filteredSaveMessage =
          "Refund review recorded. The order no longer matches this page or filter.";
      } else if (
        saved === "dispatched" &&
        savedOrder.hat_status === "dispatched"
      ) {
        filteredSaveMessage =
          "Hat dispatch recorded. The order is outside the current page or filter.";
      }
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F0E5] px-5 py-10 text-[#173A2C] md:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-extrabold tracking-[0.18em] text-[#C96632]">
              PURCHASES & DELIVERY
            </p>
            <h1 className="mt-4 text-4xl font-black tracking-tight">
              Orders
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#52645A]">
              Program purchases, gift certificates and standalone
              hats. “Access / order prepared” does not mean a
              hat has been dispatched.
            </p>
          </div>

          <a
            href={listHref(page)}
            className="rounded-full border border-[#173A2C]/25 px-5 py-3 text-sm font-bold"
          >
            Refresh orders
          </a>
        </div>

        <form
          action="/admin/orders"
          method="get"
          className="mt-8 grid items-end gap-4 rounded-2xl bg-[#E8EBDD] p-5 sm:grid-cols-2 lg:grid-cols-4"
        >
          <label className="text-sm font-bold">
            Order status
            <select name="status" defaultValue={status} className={selectClass}>
              <option value="">All statuses</option>
              {statuses.map(([value, title]) => (
                <option key={value} value={value}>{title}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-bold">
            Purchase type
            <select name="kind" defaultValue={kind} className={selectClass}>
              <option value="">All types</option>
              {kinds.map(([value, title]) => (
                <option key={value} value={value}>{title}</option>
              ))}
            </select>
          </label>

          <label className="text-sm font-bold">
            Environment
            <select
              name="environment"
              defaultValue={environment}
              className={selectClass}
            >
              <option value="">Sandbox and live</option>
              <option value="sandbox">Sandbox only</option>
              <option value="live">Live only</option>
            </select>
          </label>

          <button
            type="submit"
            className="rounded-full bg-[#173A2C] px-5 py-3 text-sm font-extrabold text-[#F4F0E5] hover:bg-[#245540]"
          >
            APPLY FILTERS →
          </button>
        </form>

        <p className="mt-6 text-sm text-[#52645A]">
          {count} matching {count === 1 ? "order" : "orders"}.
          All times use Australian Central time.
        </p>

        {filteredSaveMessage && (
          <p role="status" className="mt-5 rounded-2xl bg-[#E8EBDD] p-5 text-sm font-bold">
            {filteredSaveMessage}
          </p>
        )}

        {errorMessage && (
          <p role="alert" className="mt-5 rounded-2xl bg-[#C96632]/10 p-5 text-sm leading-relaxed">
            {errorMessage}
          </p>
        )}

        {detailsUnavailable && (
          <p role="alert" className="mt-5 rounded-2xl bg-[#C96632]/10 p-5 text-sm leading-relaxed">
            Some order details could not be loaded completely.
            Review and dispatch controls are unavailable.
            Refresh or narrow the filters before acting.
          </p>
        )}

        <div className="mt-6 space-y-6">
          {orders.length === 0 && (
            <p className="rounded-2xl bg-[#FBF8F0] p-6">
              No orders found for this view.
            </p>
          )}

          {orders.map((order) => (
            <PurchaseOrderCard
              key={order.id}
              order={order}
              email={emails.get(order.id)}
              gift={gifts.get(order.id)}
              refunds={refunds.get(order.id) ?? []}
              actions={actions.get(order.id) ?? []}
              detailsUnavailable={detailsUnavailable}
              filters={filters}
              saved={saved}
              selectedOrder={selectedOrder}
            />
          ))}
        </div>

        <nav
          aria-label="Order pages"
          className="mt-8 flex flex-wrap items-center justify-between gap-4 text-sm font-bold"
        >
          {page > 1 ? (
            <Link href={listHref(page - 1)} prefetch={false}>
              ← Previous
            </Link>
          ) : <span />}

          <p>Page {page} of {totalPages}</p>

          {page < totalPages ? (
            <Link href={listHref(page + 1)} prefetch={false}>
              Next →
            </Link>
          ) : <span />}
        </nav>

        <p className="mt-8 border-t border-[#173A2C]/15 pt-6 text-xs leading-relaxed text-[#52645A]">
          Recorded refunded amounts include successful refunds.
          Refunds do not automatically cancel memberships or
          bookings. Recent history shows up to five actions per
          order from the latest 100 actions for this page.
          Emails and gift codes are not resent from this view.
        </p>
      </div>
    </main>
  );
}