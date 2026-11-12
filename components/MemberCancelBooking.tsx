"use client";

import { useFormStatus } from "react-dom";
import { cancelMemberBooking } from "../app/members/booking-actions";

function CancelButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-[#9B3D24] px-6 py-3 text-sm font-extrabold text-white hover:bg-[#7F301C] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632] disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "CANCELLING…" : "CONFIRM CANCELLATION"}
    </button>
  );
}

export default function MemberCancelBooking({
  bookingId,
  sessionTitle,
}: {
  bookingId: string;
  sessionTitle: string;
}) {
  return (
    <details className="mt-5 border-t border-[#173A2C]/20 pt-4">
      <summary className="cursor-pointer py-2 text-sm font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]">
        Cancel this booking
      </summary>

      <div className="mt-3 rounded-2xl border border-[#9B3D24]/25 bg-[#FBF8F0] p-5">
        <h4 className="font-black">
          Cancel your {sessionTitle} booking?
        </h4>

        <p className="mt-3 text-sm leading-relaxed text-[#52645A]">
          Your place will be released. This cannot be undone,
          and another place is not reserved automatically.
          You can book again if your entitlement is available
          and there is space.
        </p>

        <p className="mt-3 text-sm leading-relaxed text-[#52645A]">
          Previous waitlist entries will not reopen automatically.
          Cancelling a booking does not cancel your membership
          or process a refund.
        </p>

        <form action={cancelMemberBooking} className="mt-5">
          <input
            type="hidden"
            name="booking_id"
            value={bookingId}
          />

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              name="confirm_cancellation"
              value="yes"
              required
              className="mt-1 size-5 shrink-0 accent-[#9B3D24]"
            />

            <span className="text-sm leading-relaxed">
              I understand my place will be released and want
              to cancel this booking.
            </span>
          </label>

          <CancelButton />
        </form>
      </div>
    </details>
  );
}