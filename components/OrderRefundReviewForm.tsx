"use client";

import { useFormStatus } from "react-dom";
import { reviewPurchaseRefund } from "../app/admin/orders/actions";

type Props = {
  orderId: string;
  refundSnapshotAt: string;
  memberLinked: boolean;
  fullyRefunded: boolean;
  hatDispatched: boolean;
  filters: {
    status: string;
    kind: string;
    environment: string;
    page: number;
  };
};

const inputClass =
  "mt-2 w-full rounded-xl border border-[#173A2C]/20 bg-white px-4 py-3 text-sm focus:border-[#C96632] focus:outline-none focus:ring-2 focus:ring-[#C96632]/25";

function ReviewButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-[#173A2C] px-6 py-3 text-sm font-extrabold text-[#F4F0E5] hover:bg-[#245540] disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "SAVING REVIEW…" : "RECORD COMPLETED REVIEW →"}
    </button>
  );
}

export default function OrderRefundReviewForm({
  orderId,
  refundSnapshotAt,
  memberLinked,
  fullyRefunded,
  hatDispatched,
  filters,
}: Props) {
  return (
    <details className="mt-5 rounded-2xl border border-[#C96632]/30 bg-[#C96632]/5 p-5">
      <summary className="cursor-pointer text-sm font-extrabold">
        Complete refund review
      </summary>

      <form action={reviewPurchaseRefund} className="mt-5 space-y-5">
        <input type="hidden" name="order_id" value={orderId} />
        <input
          type="hidden"
          name="refund_snapshot_at"
          value={refundSnapshotAt}
        />
        <input type="hidden" name="filter_status" value={filters.status} />
        <input type="hidden" name="filter_kind" value={filters.kind} />
        <input
          type="hidden"
          name="filter_environment"
          value={filters.environment}
        />
        <input type="hidden" name="filter_page" value={filters.page} />

        <p className="text-sm leading-relaxed text-[#52645A]">
          Check Stripe, the linked membership, bookings and
          delivery before completing this review. This form
          records your decisions; it does not issue money,
          cancel bookings or archive a member.
        </p>

        <div>
          <label
            htmlFor={`resolution-${orderId}`}
            className="text-sm font-bold"
          >
            Order outcome
          </label>

          <select
            id={`resolution-${orderId}`}
            name="resolution"
            defaultValue=""
            required
            className={inputClass}
          >
            <option value="" disabled>Choose an outcome</option>

            {fullyRefunded ? (
              <option value="close_order">
                Close this fully refunded order
              </option>
            ) : (
              <option value="continue_order">
                Continue the remaining order as agreed
              </option>
            )}
          </select>
        </div>

        {memberLinked ? (
          <div>
            <label
              htmlFor={`access-${orderId}`}
              className="text-sm font-bold"
            >
              Membership decision
            </label>

            <select
              id={`access-${orderId}`}
              name="access_decision"
              defaultValue=""
              required
              className={inputClass}
            >
              <option value="" disabled>Choose a decision</option>
              <option value="retain">
                Retain the active membership as agreed
              </option>
              <option value="removed_manually">
                Access removed manually; active bookings reviewed
              </option>
            </select>

            <p className="mt-2 text-xs leading-relaxed text-[#52645A]">
              To record access as removed, first archive the
              member and resolve their active bookings in
              the existing admin screens.
            </p>
          </div>
        ) : (
          <>
            <input
              type="hidden"
              name="access_decision"
              value="not_applicable"
            />
            <p className="text-sm text-[#52645A]">
              This order has no linked membership.
            </p>
          </>
        )}

        {fullyRefunded || hatDispatched ? (
          <>
            <input type="hidden" name="hat_decision" value="hold" />

            <p className="text-sm leading-relaxed text-[#52645A]">
              {hatDispatched
                ? "The hat is already recorded as dispatched. Its dispatch history will remain; record any return arrangements in your notes."
                : "No further hat dispatch will be authorised for this fully refunded order."}
            </p>
          </>
        ) : (
          <div>
            <label
              htmlFor={`hat-review-${orderId}`}
              className="text-sm font-bold"
            >
              Hat decision
            </label>

            <select
              id={`hat-review-${orderId}`}
              name="hat_decision"
              defaultValue=""
              required
              className={inputClass}
            >
              <option value="" disabled>Choose a decision</option>
              <option value="hold">Keep the hat on hold</option>
              <option value="release">
                Approve delivery of the included hat
              </option>
            </select>

            <p className="mt-2 text-xs leading-relaxed text-[#52645A]">
              An unused gift still needs redemption and a
              delivery address before its hat is ready.
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor={`review-notes-${orderId}`}
            className="text-sm font-bold"
          >
            Review notes
          </label>

          <textarea
            id={`review-notes-${orderId}`}
            name="notes"
            required
            minLength={10}
            maxLength={2000}
            rows={4}
            placeholder="Record the refund agreement, access decision and delivery arrangements. Avoid sensitive health information."
            className={`${inputClass} resize-y`}
          />
        </div>

        <label className="flex items-start gap-3">
          <input
            name="confirm_review"
            type="checkbox"
            value="yes"
            required
            className="mt-1 size-5 shrink-0 accent-[#173A2C]"
          />
          <span className="text-sm leading-relaxed text-[#52645A]">
            I have checked the current Stripe refund, membership,
            bookings and delivery arrangements. These decisions
            and notes accurately record my completed review.
          </span>
        </label>

        <ReviewButton />
      </form>
    </details>
  );
}