"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { purchaseTermsVersion } from "../lib/purchaseTerms";
import PurchaseProductPicker, {
  type PurchasePrices,
  type PurchaseProduct,
} from "./PurchaseProductPicker";
import Turnstile from "./Turnstile";

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#173A2C]/20 bg-[#FBF8F0] px-4 py-3.5 text-base text-[#173A2C] focus:border-[#C96632] focus:outline-none focus:ring-2 focus:ring-[#C96632]/25";

const productNames: Record<PurchaseProduct, string> = {
  before_baby: "Before Baby",
  after_baby: "After Baby",
  hat: "The Dad Club Hat",
};

const errorMessages: Record<string, string> = {
  invalid: "Please check your details and try again.",
  verification: "Please complete the verification and try again.",
  terms:
    "Please review and agree to the current Purchase & Gift Terms before continuing. If you had this page open earlier, refresh it first.",
  disabled: "Purchases are not available yet.",
  member_exists:
    "We couldn't start a new membership purchase with these details. If you already have a membership, sign in or contact hello@thedadclub.com.au.",
  unavailable:
    "We couldn't open checkout. Please try again or contact hello@thedadclub.com.au.",
};

export default function PurchaseForm({
  enabled,
  status,
  prices,
  initialProduct = null,
  initialKind = "self",
}: {
  enabled: boolean;
  status?: string;
  prices: PurchasePrices;
  initialProduct?: PurchaseProduct | null;
  initialKind?: "self" | "gift";
}) {
  const [product, setProduct] =
    useState<PurchaseProduct | null>(initialProduct);

  const [kind, setKind] = useState<"self" | "gift">(
    initialProduct === "hat" ? "self" : initialKind,
  );

  const detailsRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const errorMessage =
    status &&
    Object.prototype.hasOwnProperty.call(errorMessages, status)
      ? errorMessages[status]
      : undefined;

  const isProgram = product !== null && product !== "hat";
  const isGift = isProgram && kind === "gift";

  const selection =
    product === null
      ? ""
      : product === "hat"
        ? "hat"
        : `${product}_${kind}`;

  useEffect(() => {
    if (!product) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    detailsRef.current?.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });

    headingRef.current?.focus({ preventScroll: true });
  }, [product]);

  return (
    <div id="purchase-form" className="scroll-mt-6">
      {status === "cancelled" && (
        <p
          role="status"
          className="mb-6 rounded-2xl bg-[#E8EBDD] p-5 text-sm leading-relaxed"
        >
          You returned from checkout. If you completed a
          payment before returning, check its confirmation
          before purchasing again.
        </p>
      )}

      {errorMessage && (
        <p
          role="alert"
          className="mb-6 rounded-2xl border border-[#C96632]/40 bg-[#C96632]/10 p-5 text-sm leading-relaxed"
        >
          {errorMessage}
        </p>
      )}

      <PurchaseProductPicker
        selected={product}
        prices={prices}
        onSelect={setProduct}
      />

      {!enabled && (
        <p className="mt-7 rounded-2xl bg-[#E8EBDD] p-5 text-sm leading-relaxed">
          Purchases are not open yet. We&apos;re getting
          everything ready.
        </p>
      )}

      {product && (
        <div
          ref={detailsRef}
          className="mt-10 scroll-mt-6 rounded-[28px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6 sm:p-9"
        >
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#173A2C]/15 pb-6">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#C96632]">
                Your selection
              </p>

              <h2
                ref={headingRef}
                tabIndex={-1}
                className="mt-2 text-2xl font-black tracking-tight focus:outline-none"
              >
                {productNames[product]}
              </h2>
            </div>

            <p className="text-3xl font-black">
              {new Intl.NumberFormat("en-AU", {
                style: "currency",
                currency: "AUD",
                maximumFractionDigits: 0,
              }).format(prices[product] / 100)}
              <span className="ml-2 text-sm font-bold">AUD</span>
            </p>
          </div>

          {enabled && (
            <form
              action="/api/checkout"
              method="post"
              className="mt-7 space-y-6"
            >
              <input
                type="hidden"
                name="selection"
                value={selection}
              />

              <input
                type="hidden"
                name="termsVersion"
                value={purchaseTermsVersion}
              />

              {isProgram && (
                <fieldset>
                  <legend className="text-xl font-black tracking-tight">
                    2. Who is it for?
                  </legend>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      { value: "self", label: "For myself" },
                      { value: "gift", label: "A gift" },
                    ].map((option) => {
                      const active = kind === option.value;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            setKind(
                              option.value === "gift"
                                ? "gift"
                                : "self",
                            )
                          }
                          className={`min-h-12 rounded-2xl border-2 px-4 py-4 text-sm font-extrabold transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632] ${
                            active
                              ? "border-[#173A2C] bg-[#173A2C] text-[#F4F0E5]"
                              : "border-[#173A2C]/20 hover:bg-[#E8EBDD]"
                          }`}
                        >
                          {option.label}
                          {active && " ✓"}
                        </button>
                      );
                    })}
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-[#52645A]">
                    {isGift
                      ? "The certificate comes to your email for you to pass on. It has no expiry date. The dad provides his details and delivery address when redeeming."
                      : "Use the email address you want to sign in with. You will choose your session dates after purchase."}
                  </p>
                </fieldset>
              )}

              <div className="rounded-2xl bg-[#E8EBDD] p-5 text-sm leading-relaxed">
                {isProgram && (
                  <p>
                    Dates are booked separately, subject
                    to availability. Each session needs
                    six booked dads to go ahead. If we
                    cancel because numbers are too low,
                    choose another suitable date or request
                    a refund for the affected unused session.
                  </p>
                )}

                <p className={isProgram ? "mt-3" : ""}>
                  {isGift
                    ? "The included hat is dispatched within two business days after gift redemption and receipt of delivery details."
                    : "Your hat is dispatched within two business days of purchase after successful payment and receipt of complete delivery details."}
                  {" "}Standard Australian delivery is included.
                  Delivery takes additional time.
                </p>
              </div>

              <h3 className="text-xl font-black tracking-tight">
                {isProgram ? "3. Your details" : "2. Your details"}
              </h3>

              {isGift && (
                <p className="text-sm leading-relaxed text-[#52645A]">
                  Enter your own details as the purchaser,
                  rather than the gift recipient&apos;s.
                </p>
              )}

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
                  the correct purchase option.
                  {isProgram &&
                    " I understand that buying a program does not reserve specific session dates."}
                </span>
              </label>

              <label className="flex cursor-pointer items-start gap-3">
                <input
                  name="termsAccepted"
                  type="checkbox"
                  value="yes"
                  required
                  className="mt-1 size-5 shrink-0 accent-[#173A2C]"
                />

                <span className="text-sm leading-relaxed text-[#52645A]">
                  I have read and agree to the{" "}
                  <Link
                    href="/purchase/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-bold text-[#173A2C] underline underline-offset-4 hover:text-[#C96632]"
                  >
                    Purchase &amp; Gift Terms
                    <span className="sr-only">
                      {" "}(opens in a new tab)
                    </span>
                  </Link>
                  , including the applicable booking and
                  hat dispatch arrangements.
                </span>
              </label>

              <p className="text-xs leading-relaxed text-[#52645A]">
                Stripe handles payment details. We use your
                information to manage your order and provide
                what you purchase. We record your terms
                acceptance and the wording that applied.
                Read our{" "}
                <Link
                  href="/privacy/website"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold underline underline-offset-4"
                >
                  website privacy notice
                  <span className="sr-only">
                    {" "}(opens in a new tab)
                  </span>
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
        </div>
      )}
    </div>
  );
}