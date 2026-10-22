import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "../../../components/SiteHeader";
import SiteFooter from "../../../components/SiteFooter";
import {
  getSessionInformation,
  sessionInformation,
} from "../../../lib/sessionInformation";

type SessionPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return sessionInformation.map((session) => ({
    slug: session.slug,
  }));
}

export async function generateMetadata({
  params,
}: SessionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const session = getSessionInformation(slug);

  if (!session) {
    notFound();
  }

  return {
    title: `${session.title} | The Dad Club`,
    description: session.description,
    alternates: {
      canonical: `https://www.thedadclub.com.au/sessions/${session.slug}`,
    },
  };
}

export default async function SessionPage({
  params,
}: SessionPageProps) {
  const { slug } = await params;
  const session = getSessionInformation(slug);

  if (!session) {
    notFound();
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F4F0E5] text-[#173A2C]">
      <SiteHeader />

      <main>
        <section className="mx-auto max-w-6xl px-5 py-14 md:px-10 md:py-20">
          <Link
            href="/#program"
            className="text-sm font-bold underline underline-offset-4"
          >
            ← Explore the five-session program
          </Link>

          <p className="mt-10 text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
            SESSION {String(session.number).padStart(2, "0")} OF 05
          </p>

          <h1 className="mt-5 text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
            {session.title}
          </h1>

          <p className="mt-5 text-sm font-extrabold uppercase tracking-[0.12em] text-[#C96632]">
            {session.timing}
          </p>

          <p className="mt-8 max-w-3xl text-lg leading-relaxed text-[#52645A]">
            {session.description}
          </p>

          <a
            href="#register-interest"
            className="mt-8 inline-block rounded-full bg-[#173A2C] px-7 py-4 text-sm font-extrabold text-[#F4F0E5] transition hover:bg-[#245540] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]"
          >
            REGISTER YOUR INTEREST →
          </a>
        </section>

        <section className="bg-[#E8EBDD] px-5 py-16 md:px-10 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-black tracking-tight">
                A space for where you are now.
              </h2>

              <p className="mt-6 leading-relaxed text-[#52645A]">
                {session.purpose}
              </p>

              <p className="mt-5 leading-relaxed text-[#52645A]">
                You can listen, contribute and take part at your own
                pace. There is no expectation to have the right
                answers or share more than you feel comfortable with.
              </p>
            </div>

            <div className="rounded-[28px] bg-[#FBF8F0] p-6 sm:p-8">
              <h2 className="text-2xl font-black">
                What we&apos;ll explore
              </h2>

              <ul className="mt-6 list-disc space-y-4 pl-5 text-[#52645A]">
                {session.topics.map((topic) => (
                  <li key={topic} className="pl-1 leading-relaxed">
                    {topic}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-20">
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">
            Find a way to connect.
          </h2>

          <p className="mt-6 max-w-3xl leading-relaxed text-[#52645A]">
            We are planning online and face-to-face options. Dates,
            locations and delivery options will be confirmed before
            bookings open.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            <article className="rounded-[24px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6 sm:p-8">
              <h3 className="text-xl font-black">Online</h3>

              <p className="mt-4 leading-relaxed text-[#52645A]">
                Join a live, facilitated group using Microsoft Teams.
                You will need a suitable device, reliable internet
                and somewhere private to take part. Joining details
                will be provided when a session is confirmed.
              </p>
            </article>

            <article className="rounded-[24px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6 sm:p-8">
              <h3 className="text-xl font-black">Face to face</h3>

              <p className="mt-4 leading-relaxed text-[#52645A]">
                Meet other first-time fathers in a facilitated group
                at a local venue. Register your location so we can
                understand demand and let you know about relevant
                opportunities.
              </p>
            </article>
          </div>

          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-[#52645A]">
            Sessions are for adults aged 18 and over. The focus is
            your adjustment to fatherhood, wellbeing and connection.
            Groups do not provide individual therapy or clinical care.
          </p>
        </section>

        <section
          id="register-interest"
          className="scroll-mt-6 bg-[#173A2C] px-5 py-16 text-[#F4F0E5] md:px-10 md:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-extrabold tracking-[0.2em] text-[#D6A17C]">
              TAKE THE NEXT STEP
            </p>

            <h2 className="mt-5 text-3xl font-black tracking-tight md:text-4xl">
              Interested in {session.title}?
            </h2>

            <p className="mt-6 max-w-3xl leading-relaxed text-[#D8E1D8]">
              Leave your details through our interest form and
              we&apos;ll contact you about upcoming program options.
              You can mention this session and your preferred
              delivery mode in the optional message field.
            </p>

            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#D8E1D8]">
              This is an expression of interest, not a confirmed
              booking. No payment is collected and no place is
              reserved by submitting the form.
            </p>

            <Link
              href="/join"
              className="mt-8 inline-block rounded-full bg-[#F4F0E5] px-7 py-4 text-sm font-extrabold text-[#173A2C] transition hover:bg-[#E8EBDD] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4F0E5]"
            >
              REGISTER YOUR INTEREST →
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-20">
          <h2 className="text-2xl font-black">
            Explore the journey
          </h2>

          <nav
            aria-label="Program sessions"
            className="mt-6 grid gap-3 sm:grid-cols-2"
          >
            {sessionInformation.map((item) => {
              const active = item.slug === session.slug;

              return (
                <Link
                  key={item.slug}
                  href={`/sessions/${item.slug}`}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-2xl border p-5 transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632] ${
                    active
                      ? "border-[#173A2C] bg-[#173A2C] text-[#F4F0E5]"
                      : "border-[#173A2C]/15 bg-[#FBF8F0] hover:border-[#C96632]"
                  }`}
                >
                  <span className="block font-black">
                    {item.number}. {item.title}
                  </span>

                  <span className="mt-2 block text-sm">
                    {item.timing}
                  </span>
                </Link>
              );
            })}
          </nav>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}