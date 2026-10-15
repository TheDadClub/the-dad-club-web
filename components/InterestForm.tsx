import Link from "next/link";
import Turnstile from "./Turnstile";

const stages = [
  "Preparing for fatherhood",
  "Expecting a baby",
  "Baby is 0–3 months old",
  "Baby is 3–12 months old",
  "Child is 12–24 months old",
  "Another stage or enquiring for someone else",
];

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#173A2C]/20 bg-[#FBF8F0] px-4 py-3.5 text-base text-[#173A2C] placeholder:text-[#52645A]/70 focus:border-[#C96632] focus:outline-none focus:ring-2 focus:ring-[#C96632]/25";

export default function InterestForm({
  status,
}: {
  status?: string;
}) {
  const errorMessage =
    status === "invalid"
      ? "Please complete all required fields, check your email address and tick the contact consent box."
      : status === "verification"
        ? "Please complete the verification below and submit again. If the check expired, refresh the page first."
        : status === "error"
          ? "We couldn't save your registration. Please try again, or email hello@thedadclub.com.au."
          : null;

  return (
    <>
      <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
        Register your interest
      </h2>

      <p className="mt-4 text-sm leading-relaxed text-[#52645A]">
        Leave your details and we&apos;ll contact you about upcoming
        programs.
      </p>

      {errorMessage && (
        <div
          role="alert"
          className="mt-6 rounded-2xl border border-[#C96632]/40 bg-[#C96632]/10 p-5 text-sm leading-relaxed"
        >
          {errorMessage}
        </div>
      )}

      <form
        action="/api/interest"
        method="post"
        className="mt-7 space-y-6"
      >
        <div>
          <label htmlFor="name" className="text-sm font-bold">
            Your name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            maxLength={100}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-bold">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="location" className="text-sm font-bold">
            Suburb or town
          </label>
          <input
            id="location"
            name="location"
            type="text"
            autoComplete="address-level2"
            required
            maxLength={100}
            aria-describedby="location-help"
            className={inputClass}
          />
          <p
            id="location-help"
            className="mt-2 text-xs leading-relaxed text-[#52645A]"
          >
            This helps us understand where dads are interested in
            attending.
          </p>
        </div>

        <div>
          <label htmlFor="stage" className="text-sm font-bold">
            Where are you in the journey?
          </label>
          <select
            id="stage"
            name="stage"
            required
            defaultValue=""
            className={inputClass}
          >
            <option value="" disabled>
              Choose an option
            </option>
            {stages.map((stage) => (
              <option key={stage} value={stage}>
                {stage}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="message" className="text-sm font-bold">
            Anything you&apos;d like us to know?{" "}
            <span className="font-normal text-[#52645A]">
              (optional)
            </span>
          </label>
          <textarea
            id="message"
            name="message"
            rows={4}
            maxLength={600}
            aria-describedby="message-help"
            placeholder="A question about the program, for example."
            className={`${inputClass} resize-y`}
          />
          <p
            id="message-help"
            className="mt-2 text-xs leading-relaxed text-[#52645A]"
          >
            Please leave out sensitive personal or health information.
          </p>
        </div>

        <div hidden aria-hidden="true">
          <label htmlFor="website">Leave this field empty</label>
          <input
            id="website"
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
            I&apos;m happy for The Dad Club to contact me about my
            enquiry and upcoming programs.
          </span>
        </label>

        <p className="text-xs leading-relaxed text-[#52645A]">
          We store your details to manage your interest and contact
          you about programs. You can request removal by emailing{" "}
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

        <Turnstile />

        <button
          type="submit"
          className="w-full rounded-full bg-[#173A2C] px-6 py-4 text-sm font-extrabold text-[#F4F0E5] transition hover:bg-[#245540] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]"
        >
          REGISTER MY INTEREST →
        </button>
      </form>
    </>
  );
}