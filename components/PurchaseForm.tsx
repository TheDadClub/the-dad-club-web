import Link from "next/link";
import Turnstile from "./Turnstile";

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#173A2C]/20 bg-[#FBF8F0] px-4 py-3.5 text-base text-[#173A2C] focus:border-[#C96632] focus:outline-none focus:ring-2 focus:ring-[#C96632]/25";

const errorMessages: Record<string, string> = {
  invalid: "Please check your details and try again.",
  verification: "Please complete the verification and try again.",
  disabled: "Purchases are not available yet.",
  member_exists:
    "We couldn't start a new membership purchase with these details. If you already have a membership, sign in or contact hello@thedadclub.com.au.",
  unavailable:
    "We couldn't open checkout. Please try again or contact hello@thedadclub.com.au.",
};

export default function PurchaseForm({
  enabled,
  status,
}: {
  enabled: boolean;
  status?: string;
}) {
  const errorMessage = status
    ? errorMessages[status]
    : undefined;

  return (
    <section
      id="purchase-form"
      className="rounded-[28px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6 sm:p-9"
      aria-labelledby="purchase-form-title"
    >
      <h2
        id="purchase-form-title"
        className="text-2xl font-black tracking-tight"
      >
        Choose your next chapter.
      </h2>

      <p className="mt-4 leading-relaxed text-[#52645A]">
        Buy for yourself, give a dad something to look
        forward to, or pick up a Dad Club hat.
      </p>

      {status === "cancelled" && (
        <p
          role="status"
          className="mt-6 rounded-2xl bg-[#E8EBDD] p-5 text-sm leading-relaxed"
        >
          You returned from checkout. No booking has
          been made. If you completed a payment before
          returning, check its confirmation before
          purchasing again.
        </p>
      )}

      {errorMessage && (
        <p
          role="alert"
          className="mt-6 rounded-2xl border border-[#C96632]/40 bg-[#C96632]/10 p-5 text-sm leading-relaxed"
        >
          {errorMessage}
        </p>
      )}

      {!enabled ? (
        <p className="mt-6 rounded-2xl bg-[#E8EBDD] p-5 text-sm leading-relaxed">
          Purchases are not open yet. We&apos;re getting
          everything ready.
        </p>
      ) : (
        <form
          action="/api/checkout"
          method="post"
          className="mt-7 space-y-6"
        >
          <div>
            <label
              htmlFor="purchase-selection"
              className="text-sm font-bold"
            >
              What would you like?
            </label>

            <select
              id="purchase-selection"
              name="selection"
              required
              defaultValue=""
              className={inputClass}
            >
              <option value="" disabled>
                Choose an option
              </option>
              <option value="before_baby_self">
                Before Baby — for myself — $249 AUD
              </option>
              <option value="after_baby_self">
                After Baby — for myself — $179 AUD
              </option>
              <option value="before_baby_gift">
                Before Baby — a gift — $249 AUD
              </option>
              <option value="after_baby_gift">
                After Baby — a gift — $179 AUD
              </option>
              <option value="hat">
                The Dad Club Hat — $65 AUD
              </option>
            </select>

            <p className="mt-3 text-xs leading-relaxed text-[#52645A]">
              Before Baby includes all five sessions.
              After Baby includes sessions 3–5. Each
              program package includes one hat.
              Standalone hats include standard delivery
              within Australia.
            </p>
          </div>

          <div>
            <label
              htmlFor="purchase-name"
              className="text-sm font-bold"
            >
              Your name
            </label>

            <input
              id="purchase-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              maxLength={100}
              className={inputClass}
            />

            <p className="mt-2 text-xs leading-relaxed text-[#52645A]">
              Buying a gift? Enter your own details here.
              The dad provides his details when redeeming.
            </p>
          </div>

          <div>
            <label
              htmlFor="purchase-email"
              className="text-sm font-bold"
            >
              Your email
            </label>

            <input
              id="purchase-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              className={inputClass}
            />
          </div>

          <div>
            <label
              htmlFor="purchase-email-confirmation"
              className="text-sm font-bold"
            >
              Confirm your email
            </label>

            <input
              id="purchase-email-confirmation"
              name="emailConfirmation"
              type="email"
              autoComplete="off"
              required
              maxLength={254}
              className={inputClass}
            />

            <p className="mt-2 text-xs leading-relaxed text-[#52645A]">
              For your own program purchase, use the email
              you want to sign in with. Session dates are
              chosen separately after purchase.
            </p>
          </div>

          <div hidden aria-hidden="true">
            <label htmlFor="purchase-website">
              Leave this field empty
            </label>

            <input
              id="purchase-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              name="detailsConfirmed"
              type="checkbox"
              value="yes"
              required
              className="mt-1 size-5 shrink-0 accent-[#173A2C]"
            />

            <span className="text-sm leading-relaxed text-[#52645A]">
              I have checked my email address and selected
              the correct purchase option. I understand
              that buying a program does not reserve
              specific session dates.
            </span>
          </label>

          <p className="text-xs leading-relaxed text-[#52645A]">
            Stripe handles payment details. We use your
            information to manage your order and provide
            what you purchase. Read our{" "}
            <Link
              href="/privacy/website"
              className="font-semibold underline underline-offset-4"
            >
              website privacy notice
            </Link>
            .
          </p>

          <Turnstile action="purchase_checkout" />

          <button
            type="submit"
            className="w-full rounded-full bg-[#173A2C] px-6 py-4 text-sm font-extrabold text-[#F4F0E5] transition hover:bg-[#245540] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]"
          >
            CONTINUE TO SECURE CHECKOUT →
          </button>
        </form>
      )}
    </section>
  );
}