import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import PurchaseForm from "../../components/PurchaseForm";
import {
  isStripeCheckoutEnabled,
  purchasePackages,
} from "../../lib/stripe";

export const metadata: Metadata = {
  title: "Purchase | The Dad Club",
  robots: {
    index: false,
    follow: false,
  },
};

type SearchParams = Promise<{
  status?: string | string[];
  cancelled?: string | string[];
}>;

async function PurchaseContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await connection();

  const params = await searchParams;

  const status =
    params.cancelled === "1"
      ? "cancelled"
      : typeof params.status === "string"
        ? params.status
        : undefined;

  const prices = {
    before_baby: purchasePackages.before_baby.amount,
    after_baby: purchasePackages.after_baby.amount,
    hat: purchasePackages.hat.amount,
  };

  return (
    <main
      id="main-content"
      className="mx-auto max-w-6xl px-5 py-12 md:px-10 md:py-16"
    >
      <div className="rounded-2xl border border-[#C96632]/30 bg-[#E8EBDD] p-5">
        <p className="text-xs font-extrabold tracking-[0.16em] text-[#C96632]">
          SANDBOX PREVIEW
        </p>

        <p className="mt-2 text-sm leading-relaxed">
          This is a test checkout. No real money is
          charged. Confirmation emails may still be sent.
        </p>
      </div>

      <header className="mt-10">
        <p className="text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
          WELCOME TO THE CLUB →
        </p>

        <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight md:text-6xl">
          Something for the dad.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#52645A]">
          Make room for your next chapter, or give a
          first-time dad some support for his.
        </p>
      </header>

      <div className="mt-10 md:mt-12">
        <PurchaseForm
          enabled={isStripeCheckoutEnabled()}
          status={status}
          prices={prices}
        />
      </div>

      <aside
        aria-labelledby="purchase-help-title"
        className="mt-12 border-t border-[#173A2C]/15 pt-8"
      >
        <h2
          id="purchase-help-title"
          className="text-xl font-black tracking-tight"
        >
          Need a hand choosing?
        </h2>

        <p className="mt-3 max-w-2xl leading-relaxed text-[#52645A]">
          Online and face-to-face sessions have the same
          package price. You choose suitable published
          dates after activating your program.
        </p>

        <p className="mt-4 text-sm leading-relaxed text-[#52645A]">
          Questions?{" "}
          <a
            href="mailto:hello@thedadclub.com.au"
            className="break-words font-bold text-[#173A2C] underline underline-offset-4 hover:text-[#C96632]"
          >
            hello@thedadclub.com.au
          </a>
        </p>
      </aside>
    </main>
  );
}

export default function PurchasePage({
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
            className="mx-auto max-w-6xl px-5 py-14 md:px-10"
          >
            <p className="font-bold">
              Loading purchase options…
            </p>
          </main>
        }
      >
        <PurchaseContent searchParams={searchParams} />
      </Suspense>

      <SiteFooter />
    </div>
  );
}