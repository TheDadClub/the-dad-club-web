import { Temporal } from "@js-temporal/polyfill";
import { saveVenueReview } from "../app/admin/venues/actions";
import { venueReviewStatuses } from "../lib/venueReviews";

type Props = {
  id: string;
  status: string;
  internalNotes: string | null;
  followUpAt: string | null;
  reviewVersion: number;
  page: number;
  statusFilter?: string;
  view?: "all" | "due";
};

const inputClass =
  "mt-2 w-full rounded-xl border border-[#173A2C]/25 bg-[#FBF8F0] px-4 py-3 text-base text-[#173A2C] focus:outline-2 focus:outline-offset-2 focus:outline-[#C96632]";

function followUpDate(value: string | null) {
  if (!value) return "";

  return Temporal.Instant.from(value)
    .toZonedDateTimeISO("Australia/Adelaide")
    .toPlainDate()
    .toString();
}

export default function VenueReviewForm({
  id,
  status,
  internalNotes,
  followUpAt,
  reviewVersion,
  page,
  statusFilter = "",
  view = "all",
}: Props) {
  return (
    <section className="mt-6 border-t border-[#173A2C]/15 pt-6">
      <h3 className="text-lg font-black">Admin review</h3>

      <p className="mt-2 text-sm leading-relaxed text-[#52645A]">
        Internal details are visible to authorised administrators.
        Saving does not send an email or book a session.
      </p>

      <form action={saveVenueReview} className="mt-5 space-y-5">
        <input type="hidden" name="id" value={id} />
        <input
          type="hidden"
          name="review_version"
          value={reviewVersion}
        />
        <input type="hidden" name="page" value={page} />
        <input
          type="hidden"
          name="filter_status"
          value={statusFilter}
        />
        <input type="hidden" name="view" value={view} />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor={`status-${id}`}
              className="text-sm font-bold"
            >
              Partnership status
            </label>

            <select
              id={`status-${id}`}
              name="status"
              defaultValue={status}
              required
              className={inputClass}
            >
              {venueReviewStatuses.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor={`follow-up-${id}`}
              className="text-sm font-bold"
            >
              Follow-up date (optional)
            </label>

            <input
              id={`follow-up-${id}`}
              name="follow_up_date"
              type="date"
              min="2000-01-01"
              max="2100-12-31"
              defaultValue={followUpDate(followUpAt)}
              className={`${inputClass} min-w-0`}
            />

            <p className="mt-2 text-xs leading-relaxed text-[#52645A]">
              An internal planning date using Australian Central
              time. Clear or move the date after following up.
              No automatic reminder is sent.
            </p>
          </div>
        </div>

        <div>
          <label
            htmlFor={`notes-${id}`}
            className="text-sm font-bold"
          >
            Internal notes (optional)
          </label>

          <textarea
            id={`notes-${id}`}
            name="internal_notes"
            rows={4}
            maxLength={5000}
            defaultValue={internalNotes ?? ""}
            placeholder="Partnership discussions, room arrangements or next steps."
            className={`${inputClass} resize-y`}
          />

          <p className="mt-2 text-xs text-[#52645A]">
            Maximum 5,000 characters. Keep notes relevant to the
            venue partnership.
          </p>
        </div>

        <button
          type="submit"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#173A2C] px-6 py-3 text-sm font-extrabold text-[#F4F0E5] hover:bg-[#245540] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]"
        >
          SAVE REVIEW →
        </button>
      </form>
    </section>
  );
}