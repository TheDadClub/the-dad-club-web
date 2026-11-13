import Link from "next/link";
import Turnstile from "./Turnstile";
import {
  requestGiftRedemption,
  restartGiftRedemption,
  verifyGiftRedemption,
} from "../app/redeem/actions";

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#173A2C]/20 bg-[#FBF8F0] px-4 py-3.5 text-base text-[#173A2C] focus:border-[#C96632] focus:outline-none focus:ring-2 focus:ring-[#C96632]/25";

const buttonClass =
  "w-full rounded-full bg-[#173A2C] px-6 py-4 text-sm font-extrabold text-[#F4F0E5] transition hover:bg-[#245540] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]";

const errors: Record<string, string> = {
  invalid: "Please check the required details and try again.",
  verification: "Please complete the verification and try again.",
  disabled: "Gift redemption is not open yet.",
  expired:
    "Your verification session has expired. Enter your gift and delivery details again to request a new email code.",
  code:
    "We couldn't verify that email code. Check it and try again, or start again to request a new code.",
  gift:
    "We couldn't confirm an available gift with these details. Check the certificate or contact us for help.",
  membership:
    "You already have a membership linked to these details. Your gift has not been used by this attempt. Contact us so we can help.",
  unavailable:
    "We couldn't complete this step. Please try again or contact hello@thedadclub.com.au.",
};

const deliveryFields = [
  {
    name: "addressLine1",
    label: "Street address",
    autoComplete: "address-line1",
    maximum: 200,
    required: true,
  },
  {
    name: "addressLine2",
    label: "Apartment, unit or other address details (optional)",
    autoComplete: "address-line2",
    maximum: 200,
    required: false,
  },
  {
    name: "city",
    label: "Suburb or town",
    autoComplete: "address-level2",
    maximum: 100,
    required: true,
  },
];

export default function GiftRedemptionForm({
  enabled,
  error,
  pendingEmail,
}: {
  enabled: boolean;
  error?: string;
  pendingEmail?: string;
}) {
  const errorMessage = error ? errors[error] : undefined;

  return (
    <section className="rounded-[28px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6 sm:p-9">
      {errorMessage && (
        <p
          role="alert"
          className="mb-7 rounded-2xl border border-[#C96632]/40 bg-[#C96632]/10 p-5 text-sm leading-relaxed"
        >
          {errorMessage}
        </p>
      )}

      {!enabled ? (
        <p className="leading-relaxed text-[#52645A]">
          Gift redemption is not open yet.
        </p>
      ) : pendingEmail ? (
        <>
          <h2 className="text-2xl font-black tracking-tight">
            Check your email.
          </h2>

          <p className="mt-4 break-words leading-relaxed text-[#52645A]">
            Enter the verification code sent to{" "}
            <strong>{pendingEmail}</strong>. Check your
            junk folder too.
          </p>

          <form action={verifyGiftRedemption} className="mt-7 space-y-6">
            <div>
              <label
                htmlFor="gift-email-code"
                className="text-sm font-bold"
              >
                Email verification code
              </label>

              <input
                id="gift-email-code"
                name="verificationCode"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6,10}"
                minLength={6}
                maxLength={10}
                required
                className={inputClass}
              />
            </div>

            <Turnstile action="gift_redemption" />

            <button type="submit" className={buttonClass}>
              VERIFY & REDEEM MY GIFT →
            </button>
          </form>

          <form action={restartGiftRedemption} className="mt-5">
            <button
              type="submit"
              className="min-h-11 text-sm font-bold underline underline-offset-4"
            >
              Change details or request a new code
            </button>
          </form>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-black tracking-tight">
            Make yourself at home.
          </h2>

          <p className="mt-4 leading-relaxed text-[#52645A]">
            Enter your certificate code and your own details.
            We&apos;ll verify your email before activating
            your program access.
          </p>

          <form action={requestGiftRedemption} className="mt-7 space-y-6">
            <div>
              <label htmlFor="gift-code" className="text-sm font-bold">
                Gift certificate code
              </label>
              <input
                id="gift-code"
                name="giftCode"
                type="text"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                maxLength={100}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="gift-name" className="text-sm font-bold">
                Your name
              </label>
              <input
                id="gift-name"
                name="name"
                type="text"
                autoComplete="name"
                maxLength={100}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="gift-email" className="text-sm font-bold">
                Your email
              </label>
              <input
                id="gift-email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="gift-email-confirmation"
                className="text-sm font-bold"
              >
                Confirm your email
              </label>
              <input
                id="gift-email-confirmation"
                name="emailConfirmation"
                type="email"
                autoComplete="off"
                maxLength={254}
                required
                className={inputClass}
              />
            </div>

            <fieldset className="space-y-5">
              <legend className="text-lg font-extrabold">
                Where should we send your hat?
              </legend>

              <p className="pt-3 text-sm leading-relaxed text-[#52645A]">
                Australian delivery addresses only.
                The parcel will be addressed to your name above.
              </p>

              {deliveryFields.map((item) => (
                <div key={item.name}>
                  <label
                    htmlFor={`gift-${item.name}`}
                    className="text-sm font-bold"
                  >
                    {item.label}
                  </label>
                  <input
                    id={`gift-${item.name}`}
                    name={item.name}
                    type="text"
                    autoComplete={item.autoComplete}
                    maxLength={item.maximum}
                    required={item.required}
                    className={inputClass}
                  />
                </div>
              ))}

              <div>
                <label htmlFor="gift-state" className="text-sm font-bold">
                  State or territory
                </label>
                <select
                  id="gift-state"
                  name="state"
                  autoComplete="address-level1"
                  defaultValue=""
                  required
                  className={inputClass}
                >
                  <option value="" disabled>Select a state</option>
                  {["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"].map(
                    (state) => (
                      <option key={state} value={state}>{state}</option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label htmlFor="gift-postcode" className="text-sm font-bold">
                  Postcode
                </label>
                <input
                  id="gift-postcode"
                  name="postcode"
                  type="text"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  required
                  className={inputClass}
                />
              </div>
            </fieldset>

            <div hidden aria-hidden="true">
              <label htmlFor="gift-website">Leave this field empty</label>
              <input
                id="gift-website"
                name="website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <label className="flex items-start gap-3">
              <input
                name="detailsConfirmed"
                type="checkbox"
                value="yes"
                required
                className="mt-1 size-5 shrink-0 accent-[#173A2C]"
              />
              <span className="text-sm leading-relaxed text-[#52645A]">
                I am redeeming this gift for myself and have
                checked my email and delivery address. I
                understand that session dates are booked
                separately, subject to available places.
              </span>
            </label>

            <p className="text-xs leading-relaxed text-[#52645A]">
              We use these details to activate your access
              and arrange hat delivery. Read our{" "}
              <Link
                href="/privacy/website"
                className="font-semibold underline underline-offset-4"
              >
                website privacy notice
              </Link>
              .
            </p>

            <Turnstile action="gift_redemption" />

            <button type="submit" className={buttonClass}>
              SEND MY EMAIL VERIFICATION CODE →
            </button>
          </form>
        </>
      )}
    </section>
  );
}