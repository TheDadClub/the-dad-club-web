
import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";

export const metadata: Metadata = {
  title: "Become a Venue Partner | The Dad Club",
  description:
    "Partner with The Dad Club to help bring first-time fathers together in welcoming Adelaide pubs and community spaces.",
};

export default function VenuePartnersPage() {
  return (
    <div className="min-h-screen bg-[#F4F0E5] text-[#173A2C]">
      <SiteHeader />

      <main>
        <section className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:px-10 md:py-24 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
              VENUE PARTNERSHIPS
            </p>

            <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              GOOD CONVERSATIONS.
              <br />
              GOOD COMPANY.
            </h1>

            <p className="mt-7 max-w-lg text-base leading-relaxed text-[#52645A] sm:text-lg">
              The Dad Club brings first-time fathers together
              to connect, share experiences and have honest
              conversations about becoming a dad.
            </p>

            <p className="mt-5 max-w-lg leading-relaxed text-[#52645A]">
              We&apos;re looking for Adelaide pubs interested
              in supporting the program by providing a
              welcoming space for small groups of dads.
            </p>

            <div className="mt-9 rounded-[28px] bg-[#173A2C] p-7 text-[#F4F0E5] sm:p-9">
              <p className="text-xs font-extrabold tracking-[0.16em] text-[#D6A17C]">
                WHAT WE&apos;RE LOOKING FOR
              </p>

              <ul className="mt-6 space-y-5 text-base leading-relaxed">
                <li>
                  A private or reasonably quiet space for
                  approximately 6–12 people.
                </li>
                <li>
                  Availability on Monday–Thursday evenings.
                </li>
                <li>
                  Access to a TV or projector for a short
                  PowerPoint presentation.
                </li>
                <li>
                  Complimentary use of the space without
                  a minimum spend commitment.
                </li>
              </ul>

              <p className="mt-7 border-t border-[#F4F0E5]/20 pt-6 text-sm leading-relaxed text-[#D8E1D8]">
                Sessions are planned around dinner, with
                participants encouraged to purchase their
                own meals and drinks.
              </p>
            </div>

            <p className="mt-6 text-sm leading-relaxed text-[#52645A]">
              As a venue partner, you&apos;ll be helping
              create more opportunities for fathers to
              connect and support one another.
            </p>
          </div>

          <div className="min-w-0 rounded-[28px] border border-[#173A2C]/10 bg-white/50 p-6 sm:p-9">
            <p className="text-xs font-extrabold tracking-[0.16em] text-[#C96632]">
              GET INVOLVED
            </p>

            <h2 className="mt-5 text-3xl font-black tracking-tight">
              Interested in hosting The Dad Club?
            </h2>

            <p className="mt-5 leading-relaxed text-[#52645A]">
              We&apos;re putting together a network of
              welcoming venues across Adelaide.
            </p>

            <p className="mt-4 leading-relaxed text-[#52645A]">
              Our venue registration form is being
              prepared. In the meantime, you can get
              in touch directly to discuss a potential
              partnership.
            </p>

            <Link
              href="mailto:hello@thedadclub.com.au?subject=The%20Dad%20Club%20Venue%20Partnership"
              className="mt-8 inline-flex rounded-full bg-[#173A2C] px-6 py-4 text-xs font-extrabold text-[#F4F0E5] transition hover:bg-[#245540]"
            >
              ENQUIRE ABOUT PARTNERING →
            </Link>

            <p className="mt-6 text-sm text-[#52645A]">
              No obligation. We&apos;d love to hear
              what might work for your venue.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
