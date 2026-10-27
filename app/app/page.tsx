import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import AppShowcase from "../../components/AppShowcase";

export const metadata: Metadata = {
  title: "The Dad Club App | Support for first-time fathers",
  description:
    "Support for your adjustment to fatherhood, from 24 weeks before birth to 24 months after. Explore The Dad Club app.",
};

const benefits = [
  {
    number: "01",
    title: "Your journey. Your pace.",
    description:
      "Content follows your stage of fatherhood, from pregnancy through your child's second birthday. Explore perspectives on identity, relationships, wellbeing and connection as life changes.",
  },
  {
    number: "02",
    title: "A moment for you.",
    description:
      "Use the Check-In to pause and reflect on how you're travelling. You don't need the perfect words, and there's no pressure to have everything figured out.",
  },
  {
    number: "03",
    title: "A little perspective.",
    description:
      "Honest reflections and relatable Reality Checks make room for the good, the hard and the occasionally ridiculous parts of becoming a dad.",
  },
  {
    number: "04",
    title: "Support within reach.",
    description:
      "Find support resources when you want another perspective or someone to talk to. Asking for support belongs in fatherhood too.",
  },
];

const accessLink =
  "mailto:hello@thedadclub.com.au?subject=The%20Dad%20Club%20app%20access";

export default function AppPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F4F0E5] text-[#173A2C]">
      <SiteHeader />

      <main id="main-content">
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:px-10 md:py-24 lg:grid-cols-[1.3fr_1fr]">
          <div className="min-w-0">
            <p className="text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
              THE DAD CLUB APP
            </p>

            <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              BIG LIFE CHANGE.
              <br />
              A LITTLE SUPPORT
              <br />
              IN YOUR POCKET.
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[#52645A]">
              Becoming a dad changes how you see yourself, your
              relationships and the world around you. The Dad Club
              app gives first-time fathers a place to pause,
              find perspective and feel a little less alone.
            </p>

            <p className="mt-5 max-w-2xl leading-relaxed text-[#52645A]">
              From 24 weeks before birth to 24 months after, make
              room for your own adjustment alongside everything
              else that comes with fatherhood.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href={accessLink}
                className="rounded-full bg-[#173A2C] px-7 py-4 text-center text-sm font-extrabold text-[#F4F0E5] transition hover:bg-[#245540] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]"
              >
                ASK ABOUT APP ACCESS →
              </a>

              <a
                href="#app-preview"
                className="rounded-full border border-[#173A2C]/30 px-7 py-4 text-center text-sm font-extrabold transition hover:bg-[#E8EBDD] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]"
              >
                TAKE A LOOK INSIDE ↓
              </a>
            </div>
          </div>

          <aside className="rounded-[30px] bg-[#173A2C] p-8 text-[#F4F0E5] sm:p-10">
            <p className="text-xs font-extrabold tracking-[0.18em] text-[#D6A17C]">
              WELCOME TO THE CLUB →
            </p>

            <p className="mt-8 text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl">
              YOU&apos;RE
              <br />
              BECOMING
              <br />
              A DAD.
              <br />
              STILL YOU,
              <br />
              JUST WITH
              <br />
              MORE GOING ON.
            </p>

            <div className="mt-8 h-2 w-20 rounded-full bg-[#C96632]" />

            <p className="mt-8 text-sm leading-relaxed text-[#D8E1D8]">
              Honest support. A bit of humour. Room to find your feet.
            </p>
          </aside>
        </section>

        <section className="bg-[#E8EBDD] px-5 py-16 md:px-10 md:py-20">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
              SPACE FOR YOUR SIDE OF THE STORY
            </p>

            <h2 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-tight md:text-4xl">
              Fatherhood is an adjustment.
              <br />
              You deserve support through it.
            </h2>

            <p className="mt-6 max-w-3xl leading-relaxed text-[#52645A]">
              The app focuses on you as a first-time father:
              how you&apos;re feeling, what&apos;s changing and how
              you stay connected to yourself and other people.
              There is room for mixed feelings, questions and
              days that don&apos;t go to plan.
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {benefits.map((benefit) => (
                <article
                  key={benefit.number}
                  className="rounded-[24px] bg-[#FBF8F0] p-6 sm:p-8"
                >
                  <p className="text-xs font-extrabold tracking-[0.16em] text-[#C96632]">
                    {benefit.number}
                  </p>

                  <h3 className="mt-4 text-2xl font-black tracking-tight">
                    {benefit.title}
                  </h3>

                  <p className="mt-4 leading-relaxed text-[#52645A]">
                    {benefit.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <div id="app-preview" className="scroll-mt-6">
          <AppShowcase />
        </div>

        <section className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:px-10 md:py-20 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
              MORE WAYS TO CONNECT
            </p>

            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight md:text-4xl">
              Take the conversation beyond your phone.
            </h2>

            <p className="mt-6 leading-relaxed text-[#52645A]">
              The Dad Club also has a five-session program built
              around key moments in becoming a father. Explore
              the journey and register your interest in future
              groups.
            </p>

            <Link
              href="/#program"
              className="mt-7 inline-block rounded-full border border-[#173A2C]/30 px-6 py-4 text-sm font-extrabold transition hover:bg-[#E8EBDD] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]"
            >
              EXPLORE THE PROGRAM →
            </Link>
          </div>

          <div className="rounded-[24px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6 sm:p-8">
            <h2 className="text-2xl font-black tracking-tight">
              Questions about the app?
            </h2>

            <p className="mt-4 leading-relaxed text-[#52645A]">
              Get in touch about access, availability or anything
              you&apos;d like to know before getting started.
            </p>

            <a
              href={accessLink}
              className="mt-6 inline-block break-all font-bold underline underline-offset-4"
            >
              hello@thedadclub.com.au
            </a>

            <p className="mt-6 text-sm leading-relaxed text-[#52645A]">
              The app offers general information and reflection
              tools. It does not provide diagnosis, therapy or
              emergency support.
            </p>

            <Link
              href="/privacy/app"
              className="mt-5 inline-block text-sm font-bold underline underline-offset-4"
            >
              Read the app privacy notice →
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}