import Link from "next/link";
import OrderDispatchForm from "./OrderDispatchForm";
import OrderRefundReviewForm from "./OrderRefundReviewForm";
import { displaySessionDate } from "../lib/programSessions";

export type PurchaseOrder = {
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
  refund_updated_at: string | null;
  refund_resolution: string | null;
  refund_reviewed_at: string | null;
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

export type OrderEmail = {
  order_id: string;
  status: string;
  accepted_at: string | null;
};

export type OrderGift = {
  order_id: string;
  status: string;
  redeemed_at: string | null;
};

export type OrderRefund = {
  order_id: string;
  stripe_refund_id: string;
  amount: number;
  status: string;
  stripe_created_at: string;
};

export type OrderAction = {
  id: string;
  order_id: string;
  actor_id: string;
  action: string;
  created_at: string;
  notes: string;
  details: unknown;
};

export type OrderFilters = {
  status: string;
  kind: string;
  environment: string;
  page: number;
};

export function orderMoney(value: number | null) {
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

function object(value: unknown): Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readable(value: unknown) {
  return text(value).replaceAll("_", " ");
}

function addressLines(value: unknown) {
  const shipping = object(value);
  const address = object(shipping.address);

  return [
    text(shipping.name),
    text(address.line1),
    text(address.line2),
    [
      text(address.city),
      text(address.state),
      text(address.postal_code),
    ].filter(Boolean).join(" "),
    text(address.country),
  ].filter(Boolean).join("\n");
}

function label(
  options: ReadonlyArray<readonly [string, string]>,
  value: string | undefined,
  fallback: string,
) {
  return options.find(([key]) => key === value)?.[1] ?? fallback;
}

export default function PurchaseOrderCard({
  order,
  email,
  gift,
  refunds,
  actions,
  detailsUnavailable,
  filters,
  saved,
  selectedOrder,
}: {
  order: PurchaseOrder;
  email?: OrderEmail;
  gift?: OrderGift;
  refunds: OrderRefund[];
  actions: OrderAction[];
  detailsUnavailable: boolean;
  filters: OrderFilters;
  saved: string;
  selectedOrder: string;
}) {
  const address = addressLines(order.shipping_details);

  const approvedPartial =
    order.refund_resolution === "continue_order" &&
    Boolean(order.refund_reviewed_at && order.refund_updated_at) &&
    Date.parse(order.refund_reviewed_at ?? "") >=
      Date.parse(order.refund_updated_at ?? "");

  const canDispatch =
    order.status === "fulfilled" &&
    !order.refund_review_required &&
    order.hat_status === "ready" &&
    order.refunded_amount < order.expected_amount &&
    (order.refunded_amount === 0 || approvedPartial) &&
    Boolean(address) &&
    !detailsUnavailable &&
    (order.purchase_kind !== "gift" || gift?.status === "redeemed");

  const pendingRefund = refunds.some(
    (refund) =>
      refund.status === "pending" ||
      refund.status === "requires_action",
  );

  const fullyRefunded =
    order.paid_amount !== null &&
    order.paid_amount > 0 &&
    order.refunded_amount === order.paid_amount;

  const canReview =
    order.status === "review" &&
    order.refund_review_required &&
    Boolean(order.refund_updated_at) &&
    refunds.length > 0 &&
    !pendingRefund &&
    !detailsUnavailable &&
    (fullyRefunded || Boolean(order.fulfilled_at));

  const statusLabel = label(
    [
      ["awaiting_payment", "Awaiting payment"],
      ["paid", "Payment recorded"],
      ["fulfilled", "Access / order prepared"],
      ["review", "Needs review"],
      ["expired", "Expired checkout"],
      ["refunded", "Refunded — order closed"],
    ],
    order.status,
    order.status,
  );

  const packageName = label(
    [
      ["before_baby", "Before Baby"],
      ["after_baby", "After Baby"],
      ["hat", "The Dad Club Hat"],
    ],
    order.package_code,
    "Unknown package",
  );

  const kindLabel = label(
    [
      ["self", "Own program"],
      ["gift", "Gift"],
      ["hat", "Standalone hat"],
    ],
    order.purchase_kind,
    order.purchase_kind,
  );

  const hatLabel = label(
    [
      ["ready", "Ready to arrange delivery"],
      ["dispatched", "Dispatched"],
      ["hold", "On hold"],
      ["not_ready", "Not ready"],
    ],
    order.hat_status,
    order.hat_status,
  );

  return (
    <article
      id={`order-${order.id}`}
      className="scroll-mt-6 rounded-[24px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6 sm:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wide text-[#C96632]">
            {order.stripe_environment} · {kindLabel}
          </p>
          <h2 className="mt-3 text-2xl font-black">{packageName}</h2>
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
          {statusLabel}
        </span>
      </div>

      {selectedOrder === order.id &&
        saved === "dispatched" &&
        order.hat_status === "dispatched" && (
          <p role="status" className="mt-5 rounded-2xl bg-[#E8EBDD] p-4 text-sm font-bold">
            Hat dispatch recorded.
          </p>
        )}

      {selectedOrder === order.id &&
        saved === "reviewed" &&
        !order.refund_review_required &&
        order.refund_reviewed_at && (
          <p role="status" className="mt-5 rounded-2xl bg-[#E8EBDD] p-4 text-sm font-bold">
            Refund review recorded.
          </p>
        )}

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div>
          <h3 className="text-sm font-extrabold">Purchaser</h3>
          <p className="mt-2 break-words">{order.purchaser_name}</p>
          <p className="mt-1 break-all text-sm text-[#52645A]">
            {order.purchaser_email}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-extrabold">Payment</h3>
          <p className="mt-2 text-sm">
            Expected: {orderMoney(order.expected_amount)}
          </p>
          <p className="mt-1 text-sm">
            Recorded paid: {orderMoney(order.paid_amount)}
          </p>
          <p className="mt-1 text-sm">
            Recorded refunded: {orderMoney(order.refunded_amount)}
          </p>

          {order.refund_review_required && (
            <p className="mt-2 text-sm font-bold text-[#9B3D24]">
              Refund follow-up required
            </p>
          )}

          {!order.refund_review_required && order.refund_reviewed_at && (
            <p className="mt-2 text-xs leading-relaxed text-[#52645A]">
              Reviewed {when(order.refund_reviewed_at)}.
              {order.refund_resolution === "continue_order"
                ? " Remaining order approved to continue."
                : " Fully refunded order closed."}
            </p>
          )}
        </div>

        <div>
          <h3 className="text-sm font-extrabold">Hat</h3>
          <p className="mt-2 text-sm">{hatLabel}</p>

          {order.hat_dispatched_at && (
            <p className="mt-1 text-sm text-[#52645A]">
              Dispatched {when(order.hat_dispatched_at)}
            </p>
          )}

          {order.hat_tracking_reference && (
            <p className="mt-2 break-words text-sm text-[#52645A]">
              Tracking / delivery note: {order.hat_tracking_reference}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-[#E8EBDD] p-5 text-sm leading-relaxed">
        <p>
          <strong>Confirmation email:</strong>{" "}
          {detailsUnavailable
            ? "Details unavailable"
            : label(
                [
                  ["pending", "Pending"],
                  ["accepted", "Accepted for sending"],
                  ["not_confirmed", "Sending not confirmed — review"],
                  ["skipped", "Skipped"],
                ],
                email?.status,
                "Not prepared",
              )}
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
            {detailsUnavailable
              ? "Details unavailable"
              : label(
                  [
                    ["available", "Available to redeem"],
                    ["redeemed", "Redeemed"],
                    ["void", "Void"],
                  ],
                  gift?.status,
                  "Not issued",
                )}
            {gift?.redeemed_at ? ` — ${when(gift.redeemed_at)}` : ""}
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
            Review reason: {readable(order.review_code)}
          </p>
        )}
      </div>

      <details className="mt-5">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-bold">
          Delivery address and order references
        </summary>

        <div className="mt-3 grid gap-6 border-t border-[#173A2C]/15 pt-5 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-extrabold">Delivery address</h3>
            <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#52645A]">
              {address ||
                (order.purchase_kind === "gift"
                  ? "Collected when the gift is redeemed."
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
            ].map(([title, value]) => (
              <div key={title}>
                <dt className="font-bold">{title}</dt>
                <dd className="mt-1 break-all text-[#52645A]">
                  {value || "Not recorded"}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </details>

      {refunds.length > 0 && (
        <details className="mt-3">
          <summary className="min-h-11 cursor-pointer py-3 text-sm font-bold">
            Refund records
          </summary>

          <div className="mt-3 space-y-3">
            {refunds.map((refund) => (
              <div key={refund.stripe_refund_id} className="rounded-xl bg-[#E8EBDD] p-4 text-sm">
                <p className="font-bold">
                  {orderMoney(refund.amount)} — {readable(refund.status)}
                </p>
                <p className="mt-1 text-xs text-[#52645A]">
                  {when(refund.stripe_created_at)}
                </p>
                <p className="mt-2 break-all text-xs text-[#52645A]">
                  {refund.stripe_refund_id}
                </p>
              </div>
            ))}
          </div>
        </details>
      )}

      {pendingRefund && (
        <p className="mt-5 text-sm font-bold text-[#9B3D24]">
          Wait for Stripe to resolve the pending refund before completing review.
        </p>
      )}

      {canReview && (
        <OrderRefundReviewForm
          key={order.refund_updated_at}
          orderId={order.id}
          refundSnapshotAt={order.refund_updated_at!}
          memberLinked={Boolean(order.member_id)}
          fullyRefunded={fullyRefunded}
          hatDispatched={order.hat_status === "dispatched"}
          filters={filters}
        />
      )}

      {canDispatch && (
        <OrderDispatchForm orderId={order.id} filters={filters} />
      )}

      {actions.length > 0 && (
        <details className="mt-3">
          <summary className="min-h-11 cursor-pointer py-3 text-sm font-bold">
            Recent review and delivery history
          </summary>

          <div className="mt-3 space-y-4">
            {actions.slice(0, 5).map((action) => {
              const details = object(action.details);

              return (
                <div key={action.id} className="rounded-xl border border-[#173A2C]/15 p-4 text-sm">
                  <p className="font-bold">
                    {action.action === "hat_dispatched"
                      ? "Hat dispatched"
                      : "Refund review recorded"}
                  </p>

                  <p className="mt-1 text-xs text-[#52645A]">
                    {when(action.created_at)}
                  </p>

                  {action.notes && (
                    <p className="mt-3 whitespace-pre-wrap break-words leading-relaxed">
                      {action.notes}
                    </p>
                  )}

                  <dl className="mt-3 space-y-2 text-xs text-[#52645A]">
                    {[
                      ["Outcome", readable(details.resolution)],
                      ["Access", readable(details.access_decision)],
                      ["Hat decision", readable(details.hat_decision)],
                      ["Tracking", text(details.tracking_reference)],
                      ["Administrator reference", action.actor_id],
                    ].filter(([, value]) => Boolean(value)).map(([title, value]) => (
                      <div key={title}>
                        <dt className="font-bold">{title}</dt>
                        <dd className="mt-1 break-words">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              );
            })}
          </div>
        </details>
      )}
    </article>
  );
}