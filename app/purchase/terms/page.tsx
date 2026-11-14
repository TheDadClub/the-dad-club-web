import type { Metadata } from "next";
import Link from "next/link";
import {
  purchaseTermsSections,
  purchaseTermsUpdated,
} from "../../../lib/purchaseTerms";

export const metadata: Metadata = {
  title: "Purchase & Gift Terms | The Dad Club",
  description:
    "Terms for Dad Club program packages, gift certificates, session bookings and hat delivery.",
};

export default function PurchaseTermsPage() {
  return (
    <main className="min-h-screen bg-[#F4F0E5] px-5 py-12 text-[#173A2C] md:px-10 md:py-20">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-[#173A2C]/15 pb-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-[#C96632]">
            The Dad Club
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">
            Purchase &amp; Gift Terms
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-[#52645A]">
            What is included, how bookings and gifts work, and what
            to expect from hat delivery, changes and refunds.
          </p>

          <p className="mt-4 text-sm text-[#52645A]">
            Last updated: {purchaseTermsUpdated}
          </p>
        </header>

        <div className="space-y-10 py-10">
          {purchaseTermsSections.map((section, index) => (
            <section
              key={section.title}
              aria-labelledby={`terms-section-${index + 1}`}
            >
              <h2
                id={`terms-section-${index + 1}`}
                className="text-xl font-black tracking-tight md:text-2xl"
              >
                {section.title}
              </h2>

              <div className="mt-4 space-y-4">
                {section.paragraphs.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-base leading-relaxed text-[#52645A]"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className="border-t border-[#173A2C]/15 pt-8">
          <p className="text-sm leading-relaxed text-[#52645A]">
            Questions?{" "}
            <a
              href="mailto:hello@thedadclub.com.au"
              className="break-words font-bold text-[#173A2C] underline underline-offset-4 hover:text-[#C96632]"
            >
              hello@thedadclub.com.au
            </a>
          </p>

          <Link
            href="/privacy/website"
            className="mt-4 inline-flex min-h-11 items-center text-sm font-bold underline underline-offset-4 hover:text-[#C96632]"
          >
            Website privacy notice →
          </Link>
        </footer>
      </div>
    </main>
  );
}