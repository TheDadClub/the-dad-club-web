
import Link from "next/link";
import Turnstile from "./Turnstile";

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#173A2C]/20 bg-[#FBF8F0] px-4 py-3.5 text-base text-[#173A2C] placeholder:text-[#52645A]/70 focus:border-[#C96632] focus:outline-none focus:ring-2 focus:ring-[#C96632]/25";

const evenings = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
];

export default function VenueInterestForm({
  status,
}: {
  status?: string;
}) {
  const errorMessage =
    status === "invalid"
      ? "Please check the required fields and try again."
      : status === "verification"
        ? "Please complete the verification and submit again."
        : status === "error"
          ? "We couldn't save your enquiry. Please try again or email hello@thedadclub.com.au."
          : null;

  return (
    <>
      <p className="text-xs font-extrabold tracking-[0.16em] text-[#C96632]">
        VENUE PARTNERSHIPS
      </p>

      <h2 className="mt-4 text-3xl font-black tracking-tight">
        Register your venue's interest
      </h2>

      <p className="mt-4 text-sm leading-relaxed text-[#52645A]">
        Tell us a little about your venue and we'll get
        in touch to discuss what might work.
      </p>

      {errorMessage && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-[#C96632]/40 bg-[#C96632]/10 p-5 text-sm"
        >
          {errorMessage}
        </div>
      )}

      <form
        action="/api/venues"
        method="post"
        className="mt-7 space-y-6"
      >
        <div>
          <label htmlFor="venueName" className="text-sm font-bold">
            Venue name
          </label>
          <input
            id="venueName"
            name="venueName"
            type="text"
            required
            maxLength={150}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="suburb" className="text-sm font-bold">
            Suburb
          </label>
          <input
            id="suburb"
            name="suburb"
            type="text"
            required
            maxLength={100}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="contactName" className="text-sm font-bold">
            Contact person
          </label>
          <input
            id="contactName"
            name="contactName"
            type="text"
            autoComplete="name"
            required
            maxLength={100}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="contactEmail" className="text-sm font-bold">
            Contact email
          </label>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="contactPhone" className="text-sm font-bold">
            Contact phone
            <span className="ml-2 font-normal text-[#52645A]">
              (optional)
            </span>
          </label>
          <input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            maxLength={30}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="capacity" className="text-sm font-bold">
            Suitable room capacity
          </label>
          <select
            id="capacity"
            name="capacity"
            required
            defaultValue=""
            className={inputClass}
          >
            <option value="" disabled>
              Select capacity
            </option>
            <option value="6-12">6–12 people</option>
            <option value="13-20">13–20 people</option>
            <option value="20+">More than 20 people</option>
            <option value="unsure">Not sure</option>
          </select>
        </div>

        <fieldset>
          <legend className="text-sm font-bold">
            Type of space available
          </legend>

          <div className="mt-3 space-y-3">
            {[
              ["private", "Private room"],
              ["semi-private", "Semi-private or separated area"],
              ["open", "Open dining area"],
            ].map(([value, label]) => (
              <label
                key={value}
                className="flex items-center gap-3 text-sm"
              >
                <input
                  type="radio"
                  name="privacy"
                  value={value}
                  required
                  className="size-5 accent-[#173A2C]"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-bold">
            Presentation equipment
          </legend>

          <div className="mt-3 space-y-3">
            {[
              ["tv", "TV or screen"],
              ["projector", "Projector"],
              ["both", "Both"],
              ["none", "Neither"],
            ].map(([value, label]) => (
              <label
                key={value}
                className="flex items-center gap-3 text-sm"
              >
                <input
                  type="radio"
                  name="equipment"
                  value={value}
                  required
                  className="size-5 accent-[#173A2C]"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-bold">
            Which evenings might be available?
          </legend>

          <p className="mt-2 text-xs text-[#52645A]">
            Select any that could work.
          </p>

          <div className="mt-3 grid grid-cols-2 gap-3">
            {evenings.map((evening) => (
              <label
                key={evening}
                className="flex items-center gap-3 text-sm"
              >
                <input
                  type="checkbox"
                  name="evenings"
                  value={evening}
                  className="size-5 accent-[#173A2C]"
                />
                {evening}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-sm font-bold">
            Would you consider complimentary room use?
          </legend>

          <p className="mt-2 text-xs leading-relaxed text-[#52645A]">
            Participants would be encouraged to purchase
            their own meals and drinks, but we cannot
            guarantee a minimum spend.
          </p>

          <div className="mt-3 space-y-3">
            {[
              ["yes", "Yes, potentially"],
              ["discuss", "Happy to discuss"],
              ["no", "Room hire would apply"],
            ].map(([value, label]) => (
              <label
                key={value}
                className="flex items-center gap-3 text-sm"
              >
                <input
                  type="radio"
                  name="complimentary"
                  value={value}
                  required
                  className="size-5 accent-[#173A2C]"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="notes" className="text-sm font-bold">
            Anything else we should know?
            <span className="ml-2 font-normal text-[#52645A]">
              (optional)
            </span>
          </label>

          <textarea
            id="notes"
            name="notes"
            rows={4}
            maxLength={1000}
            placeholder="Room details, accessibility, parking or other arrangements."
            className={`${inputClass} resize-y`}
          />
        </div>

        <div hidden aria-hidden="true">
          <label htmlFor="venueWebsite">
            Leave this field empty
          </label>
          <input
            id="venueWebsite"
            name="venueWebsite"
            type="text"
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <label className="flex cursor-pointer items-start gap-3">
          <input
            name="contactConsent"
            type="checkbox"
            value="yes"
            required
            className="mt-1 size-5 shrink-0 accent-[#173A2C]"
          />
          <span className="text-sm leading-relaxed text-[#52645A]">
            I'm authorised to enquire on behalf of this
            venue and agree to The Dad Club contacting
            me about this partnership enquiry.
          </span>
        </label>

        <p className="text-xs leading-relaxed text-[#52645A]">
          We use the information provided to assess and
          respond to venue partnership enquiries.
          Read our{" "}
          <Link
            href="/privacy/website"
            className="underline underline-offset-4"
          >
            website privacy notice
          </Link>
          .
        </p>

        <Turnstile action="venue_enquiry" />

        <button
          type="submit"
          className="w-full rounded-full bg-[#173A2C] px-6 py-4 text-sm font-extrabold text-[#F4F0E5] transition hover:bg-[#245540]"
        >
          SUBMIT VENUE ENQUIRY →
        </button>
      </form>
    </>
  );
}
