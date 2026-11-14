import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import { Suspense } from "react";
import { connection } from "next/server";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import GiftRedemptionForm from "../../components/GiftRedemptionForm";
import { readPendingGiftRedemption } from "../../lib/pendingGiftRedemption";

export const metadata: Metadata = {
  title: "Redeem Your Gift | The Dad Club",
  description:
    "Redeem your Dad Club gift and make room for your own fatherhood journey.",
  robots: {
    index: false,
    follow: false,
  },
  referrer: "no-referrer",
};

type SearchParams = Promise<{
  step?: string | string[];
  error?: string | string[];
}>;

const allowedErrors = new Set([
  "invalid",
  "verification",
  "terms",
  "disabled",
  "expired",
  "code",
  "gift",
  "membership",
  "unavailable",
]);

async function RedemptionContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await connection();

  const params = await searchParams;

  const pending =
    params.step === "verify"
      ? await readPendingGiftRedemption()
      : null;

  let error =
    typeof params.error === "string" &&
    allowedErrors.has(params.error)
      ? params.error
      : undefined;

  if (params.step === "verify" && !pending) {
    error = "expired";
  }

  const enabled =
    process.env.GIFT_REDEMPTION_ENABLED === "true";

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
          This gift redemption flow is being tested with
          sandbox purchases.
        </p>
      </div>

      <header className="mt-10">
        <p className="text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
          SOMEONE&apos;S THINKING OF YOU →
        </p>

        <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.08] tracking-tight md:text-6xl">
          This one&apos;s for the dad.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#52645A]">
          A little support. Some honest conversations.
          Room to find your feet.
        </p>
      </header>

      <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <GiftRedemptionForm
          key={randomUUID()}
          enabled={enabled}
          error={error}
          pendingEmail={pending?.email}
        />

        <aside className="rounded-[24px] bg-[#173A2C] p-7 text-[#F4F0E5]">
          <h2 className="text-2xl font-black tracking-tight">
            Your gift. Your journey.
          </h2>

          <p className="mt-5 leading-relaxed text-[#D8E1D8]">
            Your certificate includes either the five-session
            Before Baby package or the three-session
            After Baby package, plus one Dad Club hat.
          </p>

          <p className="mt-5 leading-relaxed text-[#D8E1D8]">
            Redeeming activates the included session types.
            You then choose suitable published dates,
            subject to available places.
          </p>

          <p className="mt-5 leading-relaxed text-[#D8E1D8]">
            Choose online or face-to-face sessions.
            There&apos;s no additional redemption payment,
            and your certificate has no expiry date.
          </p>

          <h3 className="mt-7 text-lg font-extrabold">
            Already a member?
          </h3>

          <p className="mt-3 leading-relaxed text-[#D8E1D8]">
            Contact us before redeeming so we can help with
            your existing access and gift.
          </p>

          <p className="mt-7 text-sm leading-relaxed text-[#D8E1D8]">
            Need a hand?{" "}
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

export default function RedeemPage({
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
              Loading gift redemption…
            </p>
          </main>
        }
      >
        <RedemptionContent searchParams={searchParams} />
      </Suspense>

      <SiteFooter />
    </div>
  );
}