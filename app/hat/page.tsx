import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";

export const metadata: Metadata = {
  title: "The Dad Club Hat | See the arrow. Say hello.",
  description:
    "A forest-green cap. A burnt-orange arrow. A simple invitation for dads to recognise each other, say hello and feel part of something.",
  alternates: {
    canonical: "https://thedadclub.com.au/hat",
  },
  openGraph: {
    title: "The Dad Club Hat",
    description:
      "See the arrow. Say hello. A small symbol of belonging and connection between dads.",
    url: "https://thedadclub.com.au/hat",
    type: "website",
  },
};

const meanings = [
  {
    number: "01",
    title: "Recognition.",
    description:
      "At the park, on a walk or waiting for a coffee. A familiar arrow can make another dad a little less of a stranger.",
  },
  {
    number: "02",
    title: "Connection.",
    description:
      "Starting a conversation can be the hardest part. The cap offers a small opening: a nod, a hello or a conversation that goes somewhere.",
  },
  {
    number: "03",
    title: "Belonging.",
    description:
      "You don't need to have fatherhood figured out to be part of the club. The cap represents being in it together, from the beginning.",
  },
];

export default function HatPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F4F0E5] text-[#173A2C]">
      <SiteHeader />

      <main id="main-content">
        <section className="mx-auto max-w-6xl px-5 pb-12 pt-14 md:px-10 md:pb-16 md:pt-20">
          <p className="text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
            THE DAD CLUB HAT
          </p>

          <h1 className="mt-6 max-w-4xl text-[clamp(2.8rem,7vw,5.5rem)] font-black leading-[1.02] tracking-[-0.045em]">
            SEE THE ARROW.
            <br />
            SAY HELLO<span className="text-[#C96632]">.</span>
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-[#52645A]">
            A small sign that you&apos;re part of something.
            And a simple way to recognise another dad who is, too.
          </p>

          <figure className="mt-10">
            <div className="relative aspect-[16/9] overflow-hidden rounded-[24px] bg-[#EEE7DB] sm:rounded-[32px]">
              <Image
                src="/images/dad-club-cap-concept.png"
                alt="The Dad Club cap concept: forest-green fabric with a small burnt-orange arrow embroidered at the centre front, shown from two angles"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 1100px"
                className="object-contain"
              />
            </div>

            <figcaption className="mt-3 text-xs leading-relaxed text-[#52645A]">
              Design concept. Final fabric, colours and embroidery
              details may vary.
            </figcaption>
          </figure>
        </section>

        <section className="bg-[#E8EBDD] px-5 py-16 md:px-10 md:py-20">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <p className="text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
                A LITTLE SIGNAL
              </p>

              <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight md:text-4xl">
                “I&apos;m a dad.
                <br />
                I&apos;m up for a chat.”
              </h2>
            </div>

            <div className="space-y-5 text-base leading-relaxed text-[#52645A] sm:text-lg">
              <p>
                Becoming a father can change your whole world.
                Meeting someone who understands even a little of
                that can make a difference to your day.
              </p>

              <p>
                That&apos;s the idea behind the hat. A recognisable
                sign between dads, wherever everyday life takes them.
                Something that makes saying hello feel a little easier.
              </p>

              <p>
                Forest green. A burnt-orange arrow. No explanation
                needed on the cap itself—the meaning comes from
                the people wearing it.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-20">
          <p className="text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
            WHAT IT STANDS FOR
          </p>

          <h2 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-tight md:text-4xl">
            Fathers supporting fathers.
          </h2>

          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {meanings.map((meaning) => (
              <article
                key={meaning.number}
                className="rounded-[24px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6 sm:p-8"
              >
                <p className="text-xs font-extrabold tracking-[0.16em] text-[#C96632]">
                  {meaning.number}
                </p>

                <h3 className="mt-5 text-2xl font-black tracking-tight">
                  {meaning.title}
                </h3>

                <p className="mt-4 leading-relaxed text-[#52645A]">
                  {meaning.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#173A2C] px-5 py-16 text-[#F4F0E5] md:px-10 md:py-20">
          <div className="mx-auto max-w-3xl">
            <p className="text-xs font-extrabold tracking-[0.2em] text-[#D6A17C]">
              IF YOU SPOT ANOTHER DAD WEARING ONE
            </p>

            <h2 className="mt-6 text-4xl font-black leading-tight tracking-tight md:text-5xl">
              A nod is a start.
              <br />
              A hello is enough.
            </h2>

            <p className="mt-7 text-lg leading-relaxed text-[#D8E1D8]">
              You don&apos;t need a clever opening line. “Dad Club?”
              might do it. So might “How are you finding it?”
            </p>

            <p className="mt-5 leading-relaxed text-[#D8E1D8]">
              Some days it might become a proper conversation.
              Other days it might just be a smile between two dads
              getting through the day.
            </p>

            <div className="mt-8 rounded-2xl border border-[#F4F0E5]/20 p-5 sm:p-6">
              <p className="font-bold">
                An invitation, never an obligation.
              </p>

              <p className="mt-3 text-sm leading-relaxed text-[#D8E1D8]">
                Wearing the cap doesn&apos;t mean being available
                for every conversation. Respect someone&apos;s space
                if they&apos;re busy or don&apos;t feel like talking.
                There&apos;s no pressure to share anything personal.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-20">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
                WELCOME TO THE CLUB
              </p>

              <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight md:text-4xl">
                Belonging starts
                <br />
                at the beginning.
              </h2>

              <p className="mt-6 leading-relaxed text-[#52645A]">
                The cap is a symbol of joining the journey, rather
                than a reward for having it all worked out.
                It carries the same idea as everything we do:
                you don&apos;t have to figure fatherhood out alone.
              </p>

              <p className="mt-5 leading-relaxed text-[#52645A]">
                And you don&apos;t need to own a hat to belong.
                There is room for you here.
              </p>
            </div>

            <div className="rounded-[24px] bg-[#E8EBDD] p-6 sm:p-8">
              <h2 className="text-2xl font-black tracking-tight">
                Find your way into The Dad Club.
              </h2>

              <p className="mt-5 leading-relaxed text-[#52645A]">
                Explore the app for support in your own time, or
                learn about our five-session journey for first-time
                fathers.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/app"
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#173A2C] px-6 py-3 text-sm font-extrabold text-[#F4F0E5] transition hover:bg-[#245540] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]"
                >
                  EXPLORE THE APP →
                </Link>

                <Link
                  href="/#program"
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#173A2C]/30 px-6 py-3 text-sm font-extrabold transition hover:bg-[#173A2C]/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]"
                >
                  THE PROGRAM →
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}