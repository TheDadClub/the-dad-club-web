"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { rescheduleMemberBooking } from "../app/members/reschedule-actions";

export type MemberChangeOption = {
  id: string;
  starts: string;
  ends: string;
  venueName: string;
  venueAddress: string;
  places: number;
};

function ChangeButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-[#173A2C] px-6 py-3 text-sm font-extrabold text-[#F4F0E5] hover:bg-[#245540] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632] disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "CHANGING BOOKING…" : "CONFIRM NEW BOOKING →"}
    </button>
  );
}

export default function MemberChangeBooking({
  bookingId,
  sessionTitle,
  options,
}: {
  bookingId: string;
  sessionTitle: string;
  options: MemberChangeOption[];
}) {
  const [selectedId, setSelectedId] = useState("");

  const selected = options.find(
    (option) => option.id === selectedId,
  );

  const hasAvailableOption = options.some(
    (option) => option.places > 0,
  );

  return (
    <details className="mt-5 border-t border-[#173A2C]/20 pt-4">
      <summary className="cursor-pointer py-2 text-sm font-bold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]">
        Change to another date
      </summary>

      <div className="mt-3 rounded-2xl border border-[#173A2C]/20 bg-[#FBF8F0] p-5">
        <h4 className="font-black">
          Choose another {sessionTitle} session
        </h4>

        <p className="mt-3 text-sm leading-relaxed text-[#52645A]">
          Your current booking stays in place unless the replacement
          is successfully secured. We check availability again when
          you confirm.
        </p>

        {!hasAvailableOption ? (
          <p className="mt-4 text-sm leading-relaxed text-[#52645A]">
            No other dates with available places are currently shown.
            Your existing booking remains unchanged. Check again
            later or contact us for help.
          </p>
        ) : (
          <form
            action={rescheduleMemberBooking}
            className="mt-5"
          >
            <input
              type="hidden"
              name="booking_id"
              value={bookingId}
            />

            <label
              htmlFor={`replacement-${bookingId}`}
              className="text-sm font-bold"
            >
              New session date
            </label>

            <select
              id={`replacement-${bookingId}`}
              name="session_id"
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              required
              className="mt-2 w-full min-w-0 rounded-xl border border-[#173A2C]/25 bg-[#F4F0E5] px-3 py-3 text-base focus:outline-2 focus:outline-offset-2 focus:outline-[#C96632]"
            >
              <option value="" disabled>
                Choose another date
              </option>

              {options.map((option) => (
                <option
                  key={option.id}
                  value={option.id}
                  disabled={option.places <= 0}
                >
                  {option.starts} — {option.venueName}
                  {option.places <= 0 ? " — Full" : ""}
                </option>
              ))}
            </select>

            {selected && (
              <div className="mt-4 rounded-xl bg-[#E8EBDD] p-4">
                <p className="text-sm font-bold">
                  Your proposed new booking
                </p>

                <dl className="mt-3 space-y-3 text-sm">
                  <div>
                    <dt className="font-bold">Starts</dt>
                    <dd className="mt-1">{selected.starts}</dd>
                  </div>

                  <div>
                    <dt className="font-bold">Ends</dt>
                    <dd className="mt-1">{selected.ends}</dd>
                  </div>

                  <div>
                    <dt className="font-bold">Venue / delivery</dt>
                    <dd className="mt-1 whitespace-pre-wrap break-words">
                      {selected.venueName}
                      {selected.venueAddress && (
                        <>
                          <br />
                          {selected.venueAddress}
                        </>
                      )}
                    </dd>
                  </div>
                </dl>

                <p className="mt-3 text-xs leading-relaxed text-[#52645A]">
                  Times use Australian Central time, including
                  daylight saving when applicable.
                </p>
              </div>
            )}

            <p className="mt-4 text-sm leading-relaxed text-[#52645A]">
              A successful change releases your previous place
              and uses the same session entitlement. It does not
              process a payment or refund. Previous waitlist entries
              do not reopen automatically.
            </p>

            <label
              key={selectedId}
              className="mt-5 flex cursor-pointer items-start gap-3"
            >
              <input
                type="checkbox"
                name="confirm_change"
                value="yes"
                required
                className="mt-1 size-5 shrink-0 accent-[#173A2C]"
              />

              <span className="text-sm leading-relaxed">
                I have checked the new date and venue and want
                to move this booking.
              </span>
            </label>

            <ChangeButton />
          </form>
        )}
      </div>
    </details>
  );
}