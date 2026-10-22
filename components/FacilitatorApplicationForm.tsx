import Link from "next/link";
import Turnstile from "./Turnstile";
import {
  facilitatorContactFields,
  facilitatorDeliveryModes,
  facilitatorExperienceFields,
  normaliseFacilitatorSource,
} from "../lib/facilitatorApplications";

type FacilitatorApplicationFormProps = {
  status?: string;
  source?: string;
};

const inputClass =
  "mt-2 w-full min-w-0 rounded-2xl border border-[#173A2C]/20 bg-[#FBF8F0] px-4 py-3.5 text-base text-[#173A2C] placeholder:text-[#52645A]/70 focus:border-[#C96632] focus:outline-none focus:ring-2 focus:ring-[#C96632]/25";

export default function FacilitatorApplicationForm({
  status,
  source,
}: FacilitatorApplicationFormProps) {
  if (status === "success") {
    return (
      <div
        role="status"
        className="rounded-[24px] border border-[#173A2C]/15 bg-[#E8EBDD] p-6 sm:p-8"
      >
        <h2 className="text-2xl font-black">
          Thanks for expressing your interest.
        </h2>

        <p className="mt-4 leading-relaxed text-[#52645A]">
          We review new expressions of interest and contact suitable
          applicants about next steps. Submitting an application does
          not guarantee work or create a facilitator account.
        </p>

        <p className="mt-4 text-sm leading-relaxed text-[#52645A]">
          If you have previously applied using this email address,
          your existing application has been kept. To update your
          details, contact{" "}
          <a
            href="mailto:hello@thedadclub.com.au"
            className="break-all underline underline-offset-4"
          >
            hello@thedadclub.com.au
          </a>
          .
        </p>
      </div>
    );
  }

  const errorMessage =
    status === "invalid"
      ? "Please check all required fields, select at least one delivery mode and tick the contact consent box."
      : status === "verification"
        ? "Please complete the verification and submit again. If it has expired, refresh the page first."
        : status === "error"
          ? "We couldn't save your application. Please try again, or email hello@thedadclub.com.au."
          : null;

  return (
    <div className="min-w-0">
      <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
        Express your interest
      </h2>

      <p className="mt-4 text-sm leading-relaxed text-[#52645A]">
        Tell us a little about yourself and the experience you would
        bring. Required fields are marked *. You do not need to be a
        dad or have completed The Dad Club program to apply.
      </p>

      <p className="mt-3 text-sm leading-relaxed text-[#52645A]">
        Please leave out bank details, identity documents, screening
        documents and personal health information about yourself or
        anyone else.
      </p>

      {errorMessage && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-[#C96632]/40 bg-[#C96632]/10 p-5 text-sm leading-relaxed"
        >
          {errorMessage} You may need to re-enter your answers.
        </div>
      )}

      <form
        action="/api/facilitators"
        method="post"
        className="mt-7 space-y-6"
      >
        <input
          type="hidden"
          name="source"
          value={normaliseFacilitatorSource(source)}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          {facilitatorContactFields.map((field) => {
            const id = `facilitator-${field.name}`;

            return (
              <div key={field.name} className="min-w-0">
                <label htmlFor={id} className="text-sm font-bold">
                  {field.label} *
                </label>

                <input
                  id={id}
                  name={field.name}
                  type={field.type}
                  autoComplete={field.autoComplete}
                  required
                  maxLength={field.maxLength}
                  className={inputClass}
                />
              </div>
            );
          })}
        </div>

        <fieldset>
          <legend className="text-sm font-bold">
            How would you like to facilitate? *
          </legend>

          <p className="mt-2 text-xs leading-relaxed text-[#52645A]">
            Select one or both. We will discuss suitability and
            preparation for each delivery mode.
          </p>

          <div className="mt-4 flex flex-wrap gap-4">
            {facilitatorDeliveryModes.map((mode) => (
              <label
                key={mode.value}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#173A2C]/20 bg-[#FBF8F0] px-4 py-3"
              >
                <input
                  type="checkbox"
                  name="delivery_modes"
                  value={mode.value}
                  className="size-5 shrink-0 accent-[#173A2C]"
                />

                <span className="text-sm font-bold">
                  {mode.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {facilitatorExperienceFields.map((field) => {
          const id = `facilitator-${field.name}`;
          const helpId = `${id}-help`;

          return (
            <div key={field.name}>
              <label htmlFor={id} className="text-sm font-bold">
                {field.label}
                {field.required ? (
                  " *"
                ) : (
                  <span className="font-normal text-[#52645A]">
                    {" "}(optional)
                  </span>
                )}
              </label>

              <p
                id={helpId}
                className="mt-2 text-xs leading-relaxed text-[#52645A]"
              >
                {field.help}
              </p>

              <textarea
                id={id}
                name={field.name}
                required={field.required}
                maxLength={field.maxLength}
                rows={field.rows}
                aria-describedby={helpId}
                className={`${inputClass} resize-y`}
              />
            </div>
          );
        })}

        <div hidden aria-hidden="true">
          <label htmlFor="facilitator-website">
            Leave this field empty
          </label>

          <input
            id="facilitator-website"
            name="website"
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
            I agree that The Dad Club may use these details to
            assess my expression of interest and contact me about
            facilitator recruitment. This does not subscribe me to
            general program marketing.
          </span>
        </label>

        <p className="text-xs leading-relaxed text-[#52645A]">
          Applications are stored to manage recruitment and are
          accessible through the website only to authorised
          administrators. You can request access, corrections or
          deletion by emailing{" "}
          <a
            href="mailto:hello@thedadclub.com.au"
            className="break-all underline underline-offset-4"
          >
            hello@thedadclub.com.au
          </a>
          . Read our{" "}
          <Link
            href="/privacy/website"
            className="underline underline-offset-4"
          >
            website privacy notice
          </Link>
          .
        </p>

        <Turnstile action="facilitator_application" />

        <button
          type="submit"
          className="w-full rounded-full bg-[#173A2C] px-6 py-4 text-sm font-extrabold text-[#F4F0E5] transition hover:bg-[#245540] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]"
        >
          SEND MY EXPRESSION OF INTEREST →
        </button>

        <p className="text-xs leading-relaxed text-[#52645A]">
          Rates, employment terms and available work will be
          confirmed separately. Applying does not guarantee an
          appointment or sessions.
        </p>
      </form>
    </div>
  );
}