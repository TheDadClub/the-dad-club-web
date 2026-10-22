import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import AppShowcase from "../components/AppShowcase";
import ProgramTimeline from "../components/ProgramTimeline";

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F4F0E5] text-[#173A2C]">
      <SiteHeader />

      <main>
        {/* HERO */}
        <section className="mx-auto grid w-full max-w-7xl items-center gap-12 px-5 py-16 md:px-10 md:py-24 lg:grid-cols-2 lg:gap-14 lg:py-32">
          <div className="min-w-0">
            <p className="mb-6 text-xs font-extrabold tracking-[0.2em] text-[#C96632] sm:text-sm">
              WELCOME TO THE CLUB
            </p>

            <h1 className="max-w-full text-[clamp(2.7rem,5.2vw,5.2rem)] font-black leading-[1.02] tracking-[-0.045em] [overflow-wrap:anywhere]">
              FATHERHOOD.
              <br />
              NO MANUAL
              <br />
              INCLUDED<span className="text-[#C96632]">.</span>
            </h1>

            <p className="mt-8 max-w-lg text-base leading-relaxed text-[#52645A] sm:text-lg">
              Becoming a dad changes everything. The Dad Club helps you
              navigate the good, the hard and the completely unexpected
              parts of fatherhood — with practical support, honest
              conversations and a bit of humour along the way.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#program"
                className="rounded-full bg-[#173A2C] px-7 py-4 text-xs font-extrabold text-[#F4F0E5] transition hover:bg-[#245540] sm:text-sm"
              >
                EXPLORE THE PROGRAM →
              </a>

              <a
                href="#app"
                className="rounded-full border-2 border-[#173A2C] px-7 py-4 text-xs font-extrabold transition hover:bg-[#173A2C] hover:text-[#F4F0E5] sm:text-sm"
              >
                DISCOVER THE APP
              </a>
            </div>
          </div>

          <div className="flex min-h-[420px] min-w-0 flex-col justify-between rounded-[32px] bg-[#173A2C] p-8 text-[#F4F0E5] sm:p-10 lg:min-h-[560px] lg:p-12">
            <p className="text-xs font-extrabold tracking-[0.2em] text-[#D6A17C] sm:text-sm">
              THE DAD CLUB →
            </p>

            <div className="py-12">
              <p className="text-[clamp(2.4rem,4.4vw,4.8rem)] font-black leading-[1.1] tracking-[-0.035em]">
                YOU DON&apos;T
                <br />
                HAVE TO
                <br />
                FIGURE IT
                <br />
                ALL OUT
                <br />
                ALONE.
              </p>

              <div className="mt-9 h-2 w-24 rounded-full bg-[#C96632]" />
            </div>

            <p className="text-xs font-bold tracking-wide text-[#D8E1D8] sm:text-sm">
              REAL DADS. REAL CONVERSATIONS. NO PERFECT ANSWERS.
            </p>
          </div>
        </section>

        {/* ABOUT */}
        <section
          id="about"
          className="bg-[#E8EBDD] px-5 py-20 md:px-10 md:py-28"
        >
          <div className="mx-auto max-w-5xl">
            <p className="mb-5 text-xs font-extrabold tracking-[0.2em] text-[#C96632] sm:text-sm">
              WHAT IS THE DAD CLUB?
            </p>

            <h2 className="max-w-4xl text-4xl font-black leading-[1.08] tracking-tight md:text-6xl">
              A little preparation. A lot of support. And a place to
              belong.
            </h2>

            <p className="mt-8 max-w-3xl text-base leading-relaxed text-[#52645A] sm:text-lg">
              The Dad Club is designed for first-time fathers, from
              pregnancy through the first two years of their
              child&apos;s life. We bring dads together to share
              experiences, build confidence and have the conversations
              that don&apos;t always happen naturally.
            </p>
          </div>
        </section>

        <ProgramTimeline />

        {/* APP SHOWCASE */}
        <section
          id="app"
          className="bg-[#173A2C] px-5 py-20 text-[#F4F0E5] md:px-10 md:py-28"
        >
          <div className="mx-auto max-w-6xl">
            <p className="mb-5 text-xs font-extrabold tracking-[0.2em] text-[#D6A17C] sm:text-sm">
              THE DAD CLUB APP
            </p>

            <h2 className="max-w-4xl text-4xl font-black leading-[1.08] tracking-tight md:text-6xl">
              SUPPORT IN YOUR POCKET.
            </h2>

            <p className="mt-8 max-w-3xl text-base leading-relaxed text-[#D8E1D8] sm:text-lg">
              The Dad Club app is your companion between sessions.
              Personalised content, useful reminders, wellbeing
              check-ins and practical support — from 24 weeks before
              birth to 24 months after.
            </p>

            <div className="mt-14">
              <AppShowcase />
            </div>
          </div>
        </section>

        {/* FACILITATOR OPPORTUNITIES */}
        <section className="bg-[#E8EBDD] px-5 py-16 md:px-10 md:py-20">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
              FACILITATE WITH THE DAD CLUB
            </p>

            <h2 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-tight md:text-5xl">
              GOOD WITH DADS? GET PAID FOR IT.
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#52645A] sm:text-lg">
              Help first-time fathers find connection and confidence.
              Explore paid facilitation opportunities, with training and
              support, online and face to face. You do not need to have
              completed The Dad Club program to express interest.
            </p>

            <a
              href="/facilitators"
              className="mt-8 inline-block rounded-full bg-[#173A2C] px-7 py-4 text-sm font-extrabold text-[#F4F0E5] transition hover:bg-[#245540] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#173A2C]"
            >
              EXPLORE FACILITATOR OPPORTUNITIES →
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}