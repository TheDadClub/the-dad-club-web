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

const offers = [
  {
    code: "before_baby",
    label: "BEFORE BABY",
    title: "The whole journey.",
    description:
      "Five sessions, from preparing for fatherhood through your child's second birthday.",
    sessions: [
      "The Beginning",
      "Getting Ready",
      "Finding Your Feet",
      "Adjusting",
      "The Next Chapter",
    ],
    note: "For yourself or as a gift. Includes one Dad Club hat.",
  },
  {
    code: "after_baby",
    label: "AFTER BABY",
    title: "Already in the thick of it?",
    description:
      "Three post-birth sessions, with room for your own adjustment alongside everything else.",
    sessions: [
      "Finding Your Feet",
      "Adjusting",
      "The Next Chapter",
    ],
    note: "For yourself or as a gift. Includes one Dad Club hat.",
  },
  {
    code: "hat",
    label: "THE DAD CLUB HAT",
    title: "A little less on top? Covered.",
    description:
      "A forest-green cap with the orange Dad Club arrow embroidered on the front.",
    sessions: [],
    note: "One hat, including standard delivery within Australia.",
  },
] as const;

function displayPrice(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

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

  return (
    <main
      id="main-content"
      className="mx-auto max-w-6xl px-5 py-14 md:px-10 md:py-20"
    >
      <div className="rounded-2xl border border-[#C96632]/30 bg-[#E8EBDD] p-5">
        <p className="text-xs font-extrabold tracking-[0.16em] text-[#C96632]">
          SANDBOX PREVIEW
        </p>
        <p className="mt-2 text-sm leading-relaxed">
          This purchase flow is being tested. It does not
          take real payments. Product availability and
          purchase terms will be confirmed before launch.
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

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {offers.map((offer) => (
          <article
            key={offer.code}
            className="flex flex-col rounded-[24px] bg-[#E8EBDD] p-6 sm:p-7"
          >
            <p className="text-xs font-extrabold tracking-[0.16em] text-[#C96632]">
              {offer.label}
            </p>

            <h2 className="mt-4 text-2xl font-black leading-tight tracking-tight">
              {offer.title}
            </h2>

            <p className="mt-5 text-4xl font-black">
              {displayPrice(purchasePackages[offer.code].amount)}
              <span className="ml-2 text-sm font-bold">
                AUD
              </span>
            </p>

            <p className="mt-2 text-xs font-semibold text-[#52645A]">
              One-off payment
            </p>

            <p className="mt-5 leading-relaxed text-[#52645A]">
              {offer.description}
            </p>

            {offer.sessions.length > 0 && (
              <ul className="mt-5 space-y-2 text-sm font-semibold">
                {offer.sessions.map((title) => (
                  <li key={title}>{title}</li>
                ))}
              </ul>
            )}

            <p className="mt-auto pt-6 text-sm leading-relaxed text-[#52645A]">
              {offer.note}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <PurchaseForm
          enabled={isStripeCheckoutEnabled()}
          status={status}
        />

        <aside className="rounded-[24px] bg-[#173A2C] p-7 text-[#F4F0E5]">
          <h2 className="text-2xl font-black tracking-tight">
            Your dates. Your choice.
          </h2>

          <p className="mt-5 leading-relaxed text-[#D8E1D8]">
            Program purchases provide access to the
            included session types. Choose suitable
            published dates separately, subject to
            available places.
          </p>

          <p className="mt-5 leading-relaxed text-[#D8E1D8]">
            Online and face-to-face sessions have the
            same package price.
          </p>

          <h3 className="mt-7 text-lg font-extrabold">
            Giving it as a gift?
          </h3>

          <p className="mt-3 leading-relaxed text-[#D8E1D8]">
            The gift certificate goes to you to give when
            you&apos;re ready. We won&apos;t contact the
            recipient to spoil the surprise. He provides
            his own details when redeeming.
          </p>

          <p className="mt-7 text-sm leading-relaxed text-[#D8E1D8]">
            Questions?{" "}
            <a
              href="mailto:hello@thedadclub.com.au"
              className="break-words font-bold underline underline-offset-4"
            >
              hello@thedadclub.com.au
            </a>
          </p>
        </aside>
      </div>
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
          <main className="mx-auto max-w-6xl px-5 py-14 md:px-10">
            <p className="font-bold">Loading purchase options…</p>
          </main>
        }
      >
        <PurchaseContent searchParams={searchParams} />
      </Suspense>

      <SiteFooter />
    </div>
  );
}