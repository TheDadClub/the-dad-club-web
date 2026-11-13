import Link from "next/link";
import { requireAdmin } from "../lib/admin";
import { displaySessionDate } from "../lib/programSessions";
import OrderDispatchForm from "./OrderDispatchForm";

export type OrderSearchParams = Promise<{
  status?: string | string[];
  kind?: string | string[];
  environment?: string | string[];
  page?: string | string[];
  saved?: string | string[];
  error?: string | string[];
  order?: string | string[];
}>;

type Order = {
  id: string;
  created_at: string;
  stripe_environment: string;
  package_code: string;
  purchase_kind: string;
  purchaser_name: string;
  purchaser_email: string;
  expected_amount: number;
  paid_amount: number | null;
  refunded_amount: number;
  refund_review_required: boolean;
  status: string;
  paid_at: string | null;
  fulfilled_at: string | null;
  member_id: string | null;
  hat_status: string;
  hat_dispatched_at: string | null;
  hat_tracking_reference: string | null;
  shipping_details: unknown;
  review_code: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
};

type EmailRecord = {
  order_id: string;
  status: string;
  accepted_at: string | null;
};

type GiftRecord = {
  order_id: string;
  status: string;
  redeemed_at: string | null;
};

const statuses = [
  ["awaiting_payment", "Awaiting payment"],
  ["paid", "Payment recorded"],
  ["fulfilled", "Access / order prepared"],
  ["review", "Needs review"],
  ["expired", "Expired checkout"],
  ["refunded", "Refunded"],
] as const;

const kinds = [
  ["self", "Own program"],
  ["gift", "Gift"],
  ["hat", "Standalone hat"],
] as const;

const dispatchErrors: Record<string, string> = {
  invalid: "Please check the dispatch details and confirmation box.",
  changed:
    "This hat is no longer ready for dispatch. Check its current status and any refund review.",
  address: "Delivery details need checking before dispatch.",
  gift: "This gift must be redeemed before its hat can be dispatched.",
  access: "Administrator access could not be verified.",
  unknown:
    "We couldn't confirm the dispatch result. Check the current hat status before trying again.",
};

const pageSize = 20;

const selectClass =
  "mt-2 w-full rounded-xl border border-[#173A2C]/20 bg-[#FBF8F0] px-4 py-3 text-sm";

function scalar(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function money(value: number | null) {
  return value === null
    ? "Not recorded"
    : new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
      }).format(value / 100);
}

function when(value: string | null) {
  return value && Number.isFinite(Date.parse(value))
    ? displaySessionDate(value)
    : "Not recorded";
}

function packageName(code: string) {
  switch (code) {
    case "before_baby":
      return "Before Baby";
    case "after_baby":
      return "After Baby";
    case "hat":
      return "The Dad Club Hat";
    default:
      return "Unknown package";
  }
}

function hatLabel(status: string) {
  switch (status) {
    case "ready":
      return "Ready to arrange delivery";
    case "dispatched":
      return "Dispatched";
    case "hold":
      return "On hold";
    default:
      return "Not ready";
  }
}

function emailLabel(status: string | undefined) {
  switch (status) {
    case "pending":
      return "Pending";
    case "accepted":
      return "Accepted for sending";
    case "not_confirmed":
      return "Sending not confirmed — review";
    case "skipped":
      return "Skipped";
    default:
      return "Not prepared";
  }
}

function giftLabel(status: string | undefined) {
  switch (status) {
    case "available":
      return "Available to redeem";
    case "redeemed":
      return "Redeemed";
    case "void":
      return "Void";
    default:
      return "Not issued";
  }
}

function object(value: unknown): Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function string(value: unknown) {
  return typeof value === "string" ? value : "";
}

function deliveryAddress(value: unknown) {
  const shipping = object(value);
  const address = object(shipping.address);

  return [
    string(shipping.name),
    string(address.line1),
    string(address.line2),
    [
      string(address.city),
      string(address.state),
      string(address.postal_code),
    ]
      .filter(Boolean)
      .join(" "),
    string(address.country),
  ]
    .filter(Boolean)
    .join("\n");
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

  const dispatchError = Object.prototype.hasOwnProperty.call(
    dispatchErrors,
    errorCode,
  )
    ? dispatchErrors[errorCode]
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
    .select(
      "id, created_at, stripe_environment, package_code, purchase_kind, purchaser_name, purchaser_email, expected_amount, paid_amount, refunded_amount, refund_review_required, status, paid_at, fulfilled_at, member_id, hat_status, hat_dispatched_at, hat_tracking_reference, shipping_details, review_code, stripe_checkout_session_id, stripe_payment_intent_id",
      { count: "exact" },
    );

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

  const orders = (result.data ?? []) as Order[];
  const count = result.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const orderIds = orders.map((order) => order.id);

  const emails = new Map<string, EmailRecord>();
  const gifts = new Map<string, GiftRecord>();

  let relatedDetailsUnavailable = false;

  if (orderIds.length > 0) {
    const [emailResult, giftResult] = await Promise.all([
      database
        .from("purchase_confirmation_emails")
        .select("order_id, status, accepted_at")
        .in("order_id", orderIds),
      database
        .from("program_gifts")
        .select("order_id, status, redeemed_at")
        .in("order_id", orderIds),
    ]);

    relatedDetailsUnavailable = Boolean(
      emailResult.error || giftResult.error,
    );

    for (const email of (emailResult.data ?? []) as EmailRecord[]) {
      emails.set(email.order_id, email);
    }

    for (const gift of (giftResult.data ?? []) as GiftRecord[]) {
      gifts.set(gift.order_id, gift);
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
            <select
              name="status"
              defaultValue={status}
              className={selectClass}
            >
              <option value="">All statuses</option>
              {statuses.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm font-bold">
            Purchase type
            <select
              name="kind"
              defaultValue={kind}
              className={selectClass}
            >
              <option value="">All types</option>
              {kinds.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
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

        {dispatchError && (
          <p
            role="alert"
            className="mt-5 rounded-2xl bg-[#C96632]/10 p-5 text-sm leading-relaxed"
          >
            {dispatchError}
          </p>
        )}

        {relatedDetailsUnavailable && (
          <p
            role="alert"
            className="mt-5 rounded-2xl bg-[#C96632]/10 p-5 text-sm"
          >
            Some email or gift details could not be loaded.
            Refresh before acting on an order.
          </p>
        )}

        <div className="mt-6 space-y-6">
          {orders.length === 0 && (
            <p className="rounded-2xl bg-[#FBF8F0] p-6">
              No orders found for this view.
            </p>
          )}

          {orders.map((order) => {
            const email = emails.get(order.id);
            const gift = gifts.get(order.id);
            const address = deliveryAddress(order.shipping_details);

            const canDispatch =
              order.status === "fulfilled" &&
              !order.refund_review_required &&
              order.refunded_amount === 0 &&
              order.hat_status === "ready" &&
              Boolean(address) &&
              !relatedDetailsUnavailable &&
              (order.purchase_kind !== "gift" ||
                gift?.status === "redeemed");

            const dispatchConfirmed =
              params.saved === "dispatched" &&
              selectedOrder === order.id &&
              order.hat_status === "dispatched";

            return (
              <article
                key={order.id}
                id={`order-${order.id}`}
                className="scroll-mt-6 rounded-[24px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6 sm:p-8"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-wide text-[#C96632]">
                      {order.stripe_environment} ·{" "}
                      {kinds.find(
                        ([value]) => value === order.purchase_kind,
                      )?.[1]}
                    </p>

                    <h2 className="mt-3 text-2xl font-black">
                      {packageName(order.package_code)}
                    </h2>

                    <p className="mt-2 text-sm text-[#52645A]">
                      Created {when(order.created_at)}
                    </p>
                  </div>

                  <span
                    className={`rounded-full px-4 py-2 text-xs font-bold ${
                      order.status === "review"
                        ? "bg-[#C96632]/15"
                        : "bg-[#E8EBDD]"
                    }`}
                  >
                    {statuses.find(
                      ([value]) => value === order.status,
                    )?.[1] ?? order.status}
                  </span>
                </div>

                {dispatchConfirmed && (
                  <p
                    role="status"
                    className="mt-5 rounded-2xl bg-[#E8EBDD] p-4 text-sm font-bold"
                  >
                    Hat dispatch recorded.
                  </p>
                )}

                <div className="mt-6 grid gap-6 md:grid-cols-3">
                  <div>
                    <h3 className="text-sm font-extrabold">
                      Purchaser
                    </h3>
                    <p className="mt-2 break-words">
                      {order.purchaser_name}
                    </p>
                    <p className="mt-1 break-all text-sm text-[#52645A]">
                      {order.purchaser_email}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold">
                      Payment
                    </h3>
                    <p className="mt-2 text-sm">
                      Expected: {money(order.expected_amount)}
                    </p>
                    <p className="mt-1 text-sm">
                      Recorded paid: {money(order.paid_amount)}
                    </p>
                    <p className="mt-1 text-sm">
                      Recorded refunded: {money(order.refunded_amount)}
                    </p>

                    {order.refund_review_required && (
                      <p className="mt-2 text-sm font-bold text-[#9B3D24]">
                        Refund follow-up required
                      </p>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-extrabold">Hat</h3>
                    <p className="mt-2 text-sm">
                      {hatLabel(order.hat_status)}
                    </p>

                    {order.hat_dispatched_at && (
                      <p className="mt-1 text-sm text-[#52645A]">
                        Dispatched {when(order.hat_dispatched_at)}
                      </p>
                    )}

                    {order.hat_tracking_reference && (
                      <p className="mt-2 break-words text-sm text-[#52645A]">
                        Tracking / delivery note:{" "}
                        {order.hat_tracking_reference}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-[#E8EBDD] p-5 text-sm leading-relaxed">
                  <p>
                    <strong>Confirmation email:</strong>{" "}
                    {relatedDetailsUnavailable
                      ? "Check unavailable details before acting"
                      : emailLabel(email?.status)}
                  </p>

                  {email?.accepted_at && (
                    <p className="mt-1 text-[#52645A]">
                      Accepted {when(email.accepted_at)}.
                      Acceptance is not proof of inbox delivery.
                    </p>
                  )}

                  {order.purchase_kind === "gift" && (
                    <p className="mt-3">
                      <strong>Gift:</strong>{" "}
                      {relatedDetailsUnavailable
                        ? "Details unavailable"
                        : giftLabel(gift?.status)}
                      {gift?.redeemed_at
                        ? ` — ${when(gift.redeemed_at)}`
                        : ""}
                    </p>
                  )}

                  {order.member_id && (
                    <Link
                      href={`/admin/members?edit=${order.member_id}#member-form`}
                      prefetch={false}
                      className="mt-3 inline-block font-bold underline underline-offset-4"
                    >
                      View linked member →
                    </Link>
                  )}

                  {order.review_code && (
                    <p className="mt-3 font-bold text-[#9B3D24]">
                      Review reason:{" "}
                      {order.review_code.replaceAll("_", " ")}
                    </p>
                  )}
                </div>

                <details className="mt-5">
                  <summary className="min-h-11 cursor-pointer py-3 text-sm font-bold">
                    Delivery address and order references
                  </summary>

                  <div className="mt-3 grid gap-6 border-t border-[#173A2C]/15 pt-5 md:grid-cols-2">
                    <div>
                      <h3 className="text-sm font-extrabold">
                        Delivery address
                      </h3>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#52645A]">
                        {address ||
                          (order.purchase_kind === "gift"
                            ? "Delivery details are collected when the gift is redeemed."
                            : "No delivery address recorded.")}
                      </p>
                    </div>

                    <dl className="space-y-3 text-xs">
                      {[
                        ["Order", order.id],
                        ["Checkout", order.stripe_checkout_session_id],
                        ["Payment", order.stripe_payment_intent_id],
                        ["Paid", when(order.paid_at)],
                        ["Access / order prepared", when(order.fulfilled_at)],
                      ].map(([label, value]) => (
                        <div key={label}>
                          <dt className="font-bold">{label}</dt>
                          <dd className="mt-1 break-all text-[#52645A]">
                            {value || "Not recorded"}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                </details>

                {canDispatch && (
                  <OrderDispatchForm
                    orderId={order.id}
                    filters={filters}
                  />
                )}
              </article>
            );
          })}
        </div>

        <nav
          aria-label="Order pages"
          className="mt-8 flex flex-wrap items-center justify-between gap-4 text-sm font-bold"
        >
          {page > 1 ? (
            <Link href={listHref(page - 1)} prefetch={false}>
              ← Previous
            </Link>
          ) : (
            <span />
          )}

          <p>Page {page} of {totalPages}</p>

          {page < totalPages ? (
            <Link href={listHref(page + 1)} prefetch={false}>
              Next →
            </Link>
          ) : (
            <span />
          )}
        </nav>

        <p className="mt-8 border-t border-[#173A2C]/15 pt-6 text-xs leading-relaxed text-[#52645A]">
          Recorded refunded amounts include successful refunds.
          Refunds flagged for review do not automatically cancel
          existing memberships or bookings. Check Stripe and the
          linked member before deciding what action is needed.
          Email and gift codes are not resent from this page.
        </p>
      </div>
    </main>
  );
}