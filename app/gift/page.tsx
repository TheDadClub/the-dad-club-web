import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import PurchaseModeNotice from "../../components/PurchaseModeNotice";
import { purchasePackages } from "../../lib/stripe";

export const metadata: Metadata = {
  title: "Give a Dad Club Gift | The Dad Club",
  description:
    "Give an expecting or new dad space to connect, share and find his feet. Choose a Before Baby or After Baby gift package.",
  robots: {
    index: false,
    follow: false,
  },
};

const gifts = [
  {
    code: "before_baby",
    label: "FOR AN EXPECTING DAD",
    title: "Before Baby",
    description:
      "Support for the whole journey, from preparing for fatherhood through the first two years.",
    sessions: [
      "The Beginning",
      "Getting Ready",
      "Finding Your Feet",
      "Adjusting",
      "The Next Chapter",
    ],
  },
  {
    code: "after_baby",
    label: "FOR A DAD WHOSE BABY HAS ARRIVED",
    title: "After Baby",
    description:
      "Already a dad? There is still plenty of room to connect, share and find his feet.",
    sessions: [
      "Finding Your Feet",
      "Adjusting",
      "The Next Chapter",
    ],
  },
] as const;

function displayPrice(amount: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(amount / 100);
}

export default function GiftPage() {
  return (
    <div className="min-h-screen bg-[#F4F0E5] text-[#173A2C]">
      <SiteHeader />

      <main
        id="main-content"
        className="mx-auto max-w-6xl px-5 py-12 md:px-10 md:py-20"
      >
        <PurchaseModeNotice />

        <header className="mt-10">
          <p className="text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
            THIS ONE&apos;S FOR THE DAD →
          </p>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-[1.08] tracking-tight md:text-6xl">
            A little support.
            <br />
            A very thoughtful gift.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#52645A]">
            There are plenty of gifts for the baby. Give
            the dad something for his own journey:
            honest conversations, connection with other
            dads and room to find his feet.
          </p>

          <p className="mt-4 max-w-2xl leading-relaxed text-[#52645A]">
            From grandparents, partners, friends or anyone
            who wants him to feel supported.
          </p>
        </header>

        <section
          aria-labelledby="gift-options-title"
          className="mt-12"
        >
          <h2
            id="gift-options-title"
            className="text-2xl font-black tracking-tight"
          >
            Two ways to say, “We&apos;ve got you.”
          </h2>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {gifts.map((gift) => (
              <Link
                key={gift.code}
                href={`/purchase?product=${gift.code}&kind=gift#purchase-form`}
                className="group flex flex-col rounded-[28px] border-2 border-[#173A2C]/15 bg-[#FBF8F0] p-7 transition hover:border-[#173A2C] hover:bg-[#E8EBDD] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632] sm:p-9"
              >
                <p className="text-xs font-extrabold tracking-[0.14em] text-[#C96632]">
                  {gift.label}
                </p>

                <h3 className="mt-4 text-3xl font-black tracking-tight">
                  {gift.title}
                </h3>

                <p className="mt-4 text-4xl font-black">
                  {displayPrice(purchasePackages[gift.code].amount)}
                  <span className="ml-2 text-sm font-bold">
                    AUD
                  </span>
                </p>

                <p className="mt-2 text-sm font-semibold text-[#52645A]">
                  One-off payment · {gift.sessions.length} sessions
                  {" "}· One Dad Club hat
                </p>

                <p className="mt-5 leading-relaxed text-[#52645A]">
                  {gift.description}
                </p>

                <ul className="mt-5 space-y-2 text-sm font-semibold">
                  {gift.sessions.map((session) => (
                    <li key={session}>{session}</li>
                  ))}
                </ul>

                <p className="mt-auto pt-6 text-sm leading-relaxed text-[#52645A]">
                  No expiry date. Standard Australian hat
                  delivery included.
                </p>

                <span className="mt-6 rounded-full bg-[#173A2C] px-6 py-4 text-center text-sm font-extrabold text-[#F4F0E5] group-hover:bg-[#245540]">
                  GIVE {gift.title.toUpperCase()} →
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="gift-how-title"
          className="mt-12 rounded-[28px] bg-[#173A2C] p-7 text-[#F4F0E5] sm:p-9"
        >
          <h2
            id="gift-how-title"
            className="text-2xl font-black tracking-tight"
          >
            A thoughtful gift. An easy handover.
          </h2>

          <ol className="mt-7 grid gap-7 md:grid-cols-3">
            <li>
              <h3 className="text-lg font-extrabold">
                1. Choose his package.
              </h3>
              <p className="mt-3 leading-relaxed text-[#D8E1D8]">
                Before Baby for an expecting dad, or After
                Baby if his little one has already arrived.
              </p>
            </li>

            <li>
              <h3 className="text-lg font-extrabold">
                2. Give it your way.
              </h3>
              <p className="mt-3 leading-relaxed text-[#D8E1D8]">
                The certificate and code come to your email.
                Print or forward them when you&apos;re ready.
                We won&apos;t contact him to spoil the surprise.
              </p>
            </li>

            <li>
              <h3 className="text-lg font-extrabold">
                3. He makes it his.
              </h3>
              <p className="mt-3 leading-relaxed text-[#D8E1D8]">
                He redeems the gift, provides his hat delivery
                address and chooses suitable published dates.
                There is no additional redemption payment.
              </p>
            </li>
          </ol>
        </section>

        <section
          aria-labelledby="gift-details-title"
          className="mt-12"
        >
          <h2
            id="gift-details-title"
            className="text-2xl font-black tracking-tight"
          >
            A few useful details.
          </h2>

          <div className="mt-6 space-y-5 leading-relaxed text-[#52645A]">
            <p>
              He can choose online or face-to-face sessions
              from the suitable dates we publish. Availability
              varies, and a gift does not reserve particular
              dates or places.
            </p>

            <p>
              Each session date needs six booked dads to go
              ahead. If we cancel because numbers are too low,
              he can choose another suitable date or request
              a refund for the affected unused session.
            </p>

            <p>
              His hat is dispatched within two business days
              after successful redemption and receipt of
              complete delivery details. Delivery takes
              additional time.
            </p>

            <p>
              If he already has a Dad Club membership, contact
              us before buying so we can help you choose the
              right option.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold">
            <Link
              href="/purchase/terms"
              className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-[#C96632]"
            >
              Purchase &amp; Gift Terms →
            </Link>

            <Link
              href="/redeem"
              className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-[#C96632]"
            >
              Already have a gift? Redeem it →
            </Link>
          </div>
        </section>

        <p className="mt-10 border-t border-[#173A2C]/15 pt-7 text-sm leading-relaxed text-[#52645A]">
          Need a hand choosing?{" "}
          <a
            href="mailto:hello@thedadclub.com.au"
            className="break-words font-bold text-[#173A2C] underline underline-offset-4 hover:text-[#C96632]"
          >
            hello@thedadclub.com.au
          </a>
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}