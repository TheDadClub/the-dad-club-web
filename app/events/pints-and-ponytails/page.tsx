import type { Metadata } from "next";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";

export const metadata: Metadata = {
  title: "Pints & Ponytails — Coming Soon | The Dad Club",
  description:
    "A hands-on Adelaide pub night for dads who want to get better at doing their kids’ hair. Details coming soon.",
};

export default function PintsAndPonytailsPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F4F0E5] text-[#173A2C]">
      <SiteHeader />

      <main id="main-content" className="flex-1 px-5 py-16 sm:py-24">
        <section
          aria-labelledby="event-heading"
          className="mx-auto max-w-3xl rounded-[28px] border border-[#173A2C]/10 bg-[#E8EBDD] p-6 sm:p-12"
        >
          <p className="text-xs font-extrabold tracking-[0.18em] text-[#A64D24]">
            COMING SOON · ADELAIDE
          </p>

          <h1
            id="event-heading"
            className="mt-5 text-4xl font-black leading-none tracking-tight sm:text-6xl"
          >
            Pints &amp; Ponytails<span className="text-[#C96632]">.</span>
          </h1>

          <p className="mt-6 max-w-xl text-xl font-bold">
            A pub night for dads who want to get better at doing their
            kids&apos; hair.
          </p>

          <p className="mt-4 max-w-xl leading-relaxed text-[#52645A]">
            We&apos;ll practise ponytails, simple plaits and how to tackle
            tangles on training heads. Dads at any stage are welcome.
            No experience or Dad Club membership needed.
          </p>

          <p className="mt-6 border-t border-[#173A2C]/15 pt-5 text-sm font-semibold leading-relaxed">
            We&apos;ll share the venue, dates and ticket details here once
            they&apos;re confirmed.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}