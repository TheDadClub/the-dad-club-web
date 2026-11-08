import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import AppShowcase from "../../components/AppShowcase";

export const metadata: Metadata = {
  title: "The Dad Club App | Support for first-time fathers",
  description:
    "A little support for a big life change. Explore The Dad Club app for first-time fathers, from 24 weeks before birth to 24 months after.",
  openGraph: {
    title: "The Dad Club App",
    description:
      "Honest perspectives, personal reflection and a bit of humour for your adjustment to fatherhood.",
    url: "https://thedadclub.com.au/app",
    type: "website",
  },
};

// Keep released false until the app is publicly available.
// Add the official App Store listing URL before enabling downloads.
const appStore = {
  released: false,
  url: "",
};

const benefits = [
  {
    number: "01",
    title: "Support that follows your journey.",
    description:
      "Explore content relevant to your stage, from pregnancy through your child's second birthday. Make sense of changes in identity, relationships, wellbeing and connection.",
  },
  {
    number: "02",
    title: "A moment to check in.",
    description:
      "Pause and reflect on how you're travelling. You don't need the perfect words, and there's no pressure to have everything figured out.",
  },
  {
    number: "03",
    title: "Perspective. With a bit of humour.",
    description:
      "Honest reflections and relatable Reality Checks make room for the good, the hard and the occasionally ridiculous parts of becoming a dad.",
  },
  {
    number: "04",
    title: "A way to find further support.",
    description:
      "Explore support resources when you want another perspective or someone to talk to. You don't have to wait until things feel overwhelming to reach out.",
  },
];

const questions = [
  {
    question: "Who is the app for?",
    answer:
      "The Dad Club is designed for first-time fathers, from 24 weeks before birth to 24 months after. Its focus is your adjustment to fatherhood: how you're feeling, what's changing and how you stay connected.",
  },
  {
    question: "Do I need to attend Dad Club sessions?",
    answer:
      "No. You can use the app on its own. The five-session program is another way to connect, but attending a group is not required to use the app.",
  },
  {
    question: "What if I don't know what to say?",
    answer:
      "That's okay. Start with a moment to check in or explore a reflection that feels relevant. There is no perfect way to feel about becoming a father.",
  },
  {
    question: "Is it therapy?",
    answer:
      "The app offers general information, perspectives and reflection tools. It does not provide diagnosis, therapy or emergency support. Its support resources can help you explore further options.",
  },
];

function AppAccess({ centred = false }: { centred?: boolean }) {
  const canDownload =
    appStore.released &&
    appStore.url.startsWith("https://apps.apple.com/");

  return (
    <div className={centred ? "text-center" : ""}>
      {canDownload ? (
        <a
          href={appStore.url}
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#173A2C] px-7 py-4 text-sm font-extrabold text-[#F4F0E5] transition hover:bg-[#245540] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]"
        >
          VIEW ON THE APP STORE ↗
        </a>
      ) : (
        <p className="inline-flex min-h-12 items-center rounded-full border border-[#173A2C]/20 bg-[#E8EBDD] px-6 py-3 text-sm font-bold">
          Coming soon to the App Store
        </p>
      )}

      <p className="mt-3 text-sm leading-relaxed text-[#52645A]">
        {canDownload
          ? "For iPhone. Check the App Store listing for pricing and compatibility."
          : "Our iPhone app is approved. We’re getting ready to welcome you."}
      </p>
    </div>
  );
}

export default function AppPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F4F0E5] text-[#173A2C]">
      <SiteHeader />

      <main id="main-content">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-14 md:px-10 md:py-20 lg:grid-cols-[1.25fr_0.85fr] lg:gap-16">
          <div className="min-w-0">
            <p className="text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
              THE DAD CLUB APP
            </p>

            <h1 className="mt-6 text-[clamp(2.5rem,6vw,4.5rem)] font-black leading-[1.04] tracking-[-0.04em]">
              BIG LIFE CHANGE.
              <br />
              A LITTLE SUPPORT
              <br />
              IN YOUR POCKET.
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#52645A]">
              You&apos;re becoming a dad. You&apos;re still you.
              There&apos;s just a lot more going on.
            </p>

            <p className="mt-5 max-w-xl leading-relaxed text-[#52645A]">
              The Dad Club helps first-time fathers make room for
              their own adjustment—with honest perspectives,
              personal reflection and a bit of humour along the way.
            </p>

            <p className="mt-5 text-sm font-bold">
              24 weeks before birth → 24 months after.
            </p>

            <div className="mt-8">
              <AppAccess />
            </div>

            <a
              href="#app-preview"
              className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-extrabold underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]"
            >
              TAKE A LOOK INSIDE
              <span aria-hidden="true">↓</span>
            </a>
          </div>

          <figure className="mx-auto w-full max-w-[380px] rounded-[32px] bg-[#173A2C] px-7 pb-7 pt-8 sm:px-10">
            <p className="text-center text-xs font-extrabold tracking-[0.18em] text-[#D6A17C]">
              WELCOME TO THE CLUB →
            </p>

            <div className="relative mx-auto mt-7 aspect-[832/1858] w-full max-w-[230px] overflow-hidden rounded-[24px] bg-[#F4F0E5] shadow-xl">
              <Image
                src="/images/dad-club-home.png"
                alt="A preview of The Dad Club app home screen"
                fill
                priority
                sizes="230px"
                className="object-contain"
              />
            </div>

            <figcaption className="mt-7 text-center text-sm leading-relaxed text-[#D8E1D8]">
              A little space for your side of the story.
            </figcaption>
          </figure>
        </section>

        <section className="bg-[#E8EBDD] px-5 py-16 md:px-10 md:py-20">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
              FOR THE DAD YOU&apos;RE BECOMING
            </p>

            <h2 className="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-tight md:text-4xl">
              Fatherhood is an adjustment.
              <br />
              You deserve support through it.
            </h2>

            <p className="mt-6 max-w-3xl leading-relaxed text-[#52645A]">
              Changing relationships. A shifting sense of identity.
              Mixed feelings you weren&apos;t expecting. The app
              makes room for what becoming a father means for you,
              including the days that don&apos;t go to plan.
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

        <section
          id="app-preview"
          aria-labelledby="app-preview-heading"
          className="scroll-mt-6 bg-[#173A2C] px-5 py-16 text-[#F4F0E5] md:px-10 md:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto mb-10 max-w-2xl text-center">
              <p className="text-xs font-extrabold tracking-[0.2em] text-[#D6A17C]">
                TAKE A LOOK INSIDE
              </p>

              <h2
                id="app-preview-heading"
                className="mt-5 text-3xl font-black leading-tight tracking-tight md:text-4xl"
              >
                Support you can come back to.
              </h2>

              <p className="mt-5 leading-relaxed text-[#D8E1D8]">
                Explore the journey, make time for a check-in and
                find a little perspective when you need it.
              </p>
            </div>

            <AppShowcase />
          </div>
        </section>

        <section
          aria-labelledby="app-questions-heading"
          className="mx-auto max-w-4xl px-5 py-16 md:px-10 md:py-20"
        >
          <p className="text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
            A FEW THINGS YOU MIGHT BE WONDERING
          </p>

          <h2
            id="app-questions-heading"
            className="mt-5 text-3xl font-black tracking-tight md:text-4xl"
          >
            Before you get started.
          </h2>

          <div className="mt-8 space-y-3">
            {questions.map((item) => (
              <details
                key={item.question}
                className="rounded-2xl border border-[#173A2C]/15 bg-[#FBF8F0] p-5 sm:p-6"
              >
                <summary className="cursor-pointer text-base font-extrabold leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]">
                  {item.question}
                </summary>

                <p className="mt-4 leading-relaxed text-[#52645A]">
                  {item.answer}
                </p>
              </details>
            ))}

            <details className="rounded-2xl border border-[#173A2C]/15 bg-[#FBF8F0] p-5 sm:p-6">
              <summary className="cursor-pointer text-base font-extrabold leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]">
                Where can I read about privacy?
              </summary>

              <p className="mt-4 leading-relaxed text-[#52645A]">
                The app has its own privacy notice explaining how
                app information is handled.{" "}
                <Link
                  href="/privacy/app"
                  className="font-bold underline underline-offset-4"
                >
                  Read the app privacy notice →
                </Link>
              </p>
            </details>
          </div>

          <p className="mt-7 text-sm leading-relaxed text-[#52645A]">
            Something else on your mind?{" "}
            <a
              href="mailto:hello@thedadclub.com.au"
              className="break-all font-bold underline underline-offset-4"
            >
              Email hello@thedadclub.com.au
            </a>
            .
          </p>
        </section>

        <section className="bg-[#E8EBDD] px-5 py-14 md:px-10 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-black leading-tight tracking-tight md:text-4xl">
              You don&apos;t need all the answers.
              <br />
              Just somewhere to start.
            </h2>

            <p className="mx-auto mt-5 max-w-xl leading-relaxed text-[#52645A]">
              Make a little room for yourself in this next chapter.
            </p>

            <div className="mt-7">
              <AppAccess centred />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14 md:px-10 md:py-16">
          <div className="rounded-[24px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6 sm:p-8">
            <p className="text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
              MORE WAYS TO CONNECT
            </p>

            <h2 className="mt-4 text-2xl font-black tracking-tight sm:text-3xl">
              Take the conversation beyond your phone.
            </h2>

            <p className="mt-5 max-w-3xl leading-relaxed text-[#52645A]">
              You can use the app on its own. If you&apos;d also like
              to connect with other first-time fathers, explore our
              five-session program and register your interest in
              future groups.
            </p>

            <Link
              href="/#program"
              className="mt-6 inline-flex min-h-12 items-center rounded-full border border-[#173A2C]/30 px-6 py-3 text-sm font-extrabold transition hover:bg-[#E8EBDD] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]"
            >
              EXPLORE THE PROGRAM →
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}