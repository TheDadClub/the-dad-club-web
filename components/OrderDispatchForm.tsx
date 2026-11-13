"use client";

import { useFormStatus } from "react-dom";
import { dispatchPurchaseHat } from "../app/admin/orders/actions";

type Props = {
  orderId: string;
  filters: {
    status: string;
    kind: string;
    environment: string;
    page: number;
  };
};

function DispatchButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-[#173A2C] px-6 py-3 text-sm font-extrabold text-[#F4F0E5] hover:bg-[#245540] disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "RECORDING…" : "MARK HAT DISPATCHED →"}
    </button>
  );
}

export default function OrderDispatchForm({
  orderId,
  filters,
}: Props) {
  return (
    <details className="mt-5 rounded-2xl border border-[#173A2C]/15 p-5">
      <summary className="cursor-pointer text-sm font-extrabold">
        Mark hat dispatched
      </summary>

      <form action={dispatchPurchaseHat} className="mt-5 space-y-5">
        <input type="hidden" name="order_id" value={orderId} />
        <input type="hidden" name="filter_status" value={filters.status} />
        <input type="hidden" name="filter_kind" value={filters.kind} />
        <input
          type="hidden"
          name="filter_environment"
          value={filters.environment}
        />
        <input type="hidden" name="filter_page" value={filters.page} />

        <p className="text-sm leading-relaxed text-[#52645A]">
          Record this after handing the parcel to the delivery
          provider. The administrator and dispatch time will
          be recorded. This control does not send an email.
        </p>

        <div>
          <label
            htmlFor={`tracking-${orderId}`}
            className="text-sm font-bold"
          >
            Tracking reference or delivery note (optional)
          </label>

          <input
            id={`tracking-${orderId}`}
            name="tracking_reference"
            type="text"
            autoComplete="off"
            maxLength={200}
            className="mt-2 w-full rounded-xl border border-[#173A2C]/20 bg-white px-4 py-3 text-sm focus:border-[#C96632] focus:outline-none focus:ring-2 focus:ring-[#C96632]/25"
          />
        </div>

        <label className="flex items-start gap-3">
          <input
            name="confirm_dispatch"
            type="checkbox"
            value="yes"
            required
            className="mt-1 size-5 shrink-0 accent-[#173A2C]"
          />
          <span className="text-sm leading-relaxed text-[#52645A]">
            I confirm this hat has been dispatched to the
            recorded delivery address.
          </span>
        </label>

        <DispatchButton />
      </form>
    </details>
  );
}