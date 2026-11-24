import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";
import { createAdminDatabase } from "../../../lib/admin";
import { getStripeEnvironment } from "../../../lib/stripe";

export const metadata: Metadata = {
  title: "Your Purchase | The Dad Club",
  robots: {
    index: false,
    follow: false,
  },
  referrer: "no-referrer",
};

type SearchParams = Promise<{
  session_id?: string | string[];
}>;

async function PurchaseResult({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await connection();

  const environment = getStripeEnvironment();
  const sandbox = environment === "sandbox";

  const params = await searchParams;
  const sessionId =
    typeof params.session_id === "string"
      ? params.session_id
      : "";

  const referencePattern = sandbox
    ? /^cs_test_[A-Za-z0-9]+$/
    : /^cs_live_[A-Za-z0-9]+$/;

  const validReference =
    sessionId.length <= 255 &&
    referencePattern.test(sessionId);

  let status = "unknown";
  let purchaseKind = "";
  let emailAccepted = false;

  if (validReference) {
    try {
      const database = createAdminDatabase();

      const { data: order, error } = await database
        .from("purchase_orders")
        .select("id, status, purchase_kind")
        .eq("stripe_checkout_session_id", sessionId)
        .eq("stripe_environment", environment)
        .maybeSingle();

      if (!error && order) {
        status = order.status;
        purchaseKind = order.purchase_kind;

        if (status === "fulfilled") {
          const { data: email } = await database
            .from("purchase_confirmation_emails")
            .select("status")
            .eq("order_id", order.id)
            .maybeSingle();

          emailAccepted = email?.status === "accepted";
        }
      }
    } catch {
      status = "unknown";
    }
  }

  const fulfilled = status === "fulfilled";
  const processing =
    status === "awaiting_payment" || status === "paid";

  const heading = fulfilled
    ? purchaseKind === "gift"
      ? "Your gift is ready."
      : purchaseKind === "hat"
        ? "Your hat order is confirmed."
        : "Welcome to the club."
    : status === "review"
      ? "Your purchase needs a check."
      : status === "refunded"
        ? "This order has been refunded."
        : status === "expired"
          ? "This checkout has expired."
          : processing
            ? "We're preparing your purchase."
            : "Let's check your purchase.";

  const description = fulfilled
    ? purchaseKind === "gift"
      ? "Your gift certificate has been prepared. Give it to the dad when you're ready; we haven't contacted him. The certificate has no expiry date."
      : purchaseKind === "hat"
        ? "Your hat order has been recorded with the delivery details supplied at checkout."
        : "Your program access is ready. Sign in using your purchase email address, then choose available session dates."
    : status === "review"
      ? "We couldn't finish processing this order automatically. Please contact us before attempting another payment."
      : status === "refunded"
        ? "Contact us if you have questions about this order or any associated membership."
        : status === "expired"
          ? "This checkout is closed. If you believe you completed a payment, contact us before purchasing again."
          : !validReference
            ? "We couldn't identify this checkout. Check your purchase confirmation email or contact us before attempting another payment."
            : "Payment confirmation can take a moment. Check again shortly. Please don't make another payment while we confirm the result.";

  const returnUrl = validReference
    ? `/purchase/success?${new URLSearchParams({
        session_id: sessionId,
      }).toString()}`
    : "/purchase/success";

  return (
    <main
      id="main-content"
      className="mx-auto max-w-3xl px-5 py-16 md:px-10 md:py-24"
    >
      <p className="text-xs font-extrabold tracking-[0.18em] text-[#C96632]">
        {sandbox
          ? "SANDBOX PURCHASE — NO REAL PAYMENT"
          : "YOUR DAD CLUB PURCHASE"}
      </p>

      <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight md:text-5xl">
        {heading}
      </h1>

      <p className="mt-7 text-lg leading-relaxed text-[#52645A]">
        {description}
      </p>

      {fulfilled && (
        <p className="mt-6 rounded-2xl bg-[#E8EBDD] p-6 text-sm leading-relaxed">
          {emailAccepted
            ? purchaseKind === "gift"
              ? "Check your purchase email inbox and junk folder for the gift certificate and redemption code."
              : "Check your purchase email inbox and junk folder for your confirmation."
            : "Your order is confirmed, but we haven't confirmed that its email was sent. Contact us if you need the confirmation or gift certificate. Please don't purchase again."}
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-4">
        {fulfilled && purchaseKind === "self" && (
          <Link
            href="/members/login"
            className="rounded-full bg-[#173A2C] px-7 py-4 text-sm font-extrabold text-[#F4F0E5] hover:bg-[#245540] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]"
          >
            SIGN IN &amp; CHOOSE YOUR DATES →
          </Link>
        )}

        {(processing || status === "unknown") &&
          validReference && (
            <a
              href={returnUrl}
              className="rounded-full border border-[#173A2C]/30 px-7 py-4 text-sm font-extrabold hover:bg-[#E8EBDD] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]"
            >
              CHECK AGAIN →
            </a>
          )}
      </div>

      <p className="mt-10 text-sm leading-relaxed text-[#52645A]">
        Need a hand?{" "}
        <a
          href="mailto:hello@thedadclub.com.au"
          className="break-words font-bold underline underline-offset-4"
        >
          hello@thedadclub.com.au
        </a>
      </p>
    </main>
  );
}

export default function PurchaseSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="min-h-screen bg-[#F4F0E5] text-[#173A2C]">
      <SiteHeader />

      <Suspense
        fallback={
          <main
            id="main-content"
            className="mx-auto max-w-3xl px-5 py-16"
          >
            <p className="font-bold">
              Checking your purchase…
            </p>
          </main>
        }
      >
        <PurchaseResult searchParams={searchParams} />
      </Suspense>

      <SiteFooter />
    </div>
  );
}