import Link from "next/link";
import { sessionInformation } from "../lib/sessionInformation";

const sessionTags: Record<number, string> = {
  1: "PREPARING",
  2: "ANTICIPATING",
  3: "SETTLING IN",
  4: "REFLECTING",
  5: "GROWING",
};

export default function ProgramTimeline() {
  return (
    <section
      id="program"
      className="mx-auto max-w-7xl px-5 py-20 md:px-10 md:py-28"
    >
      <p className="mb-5 text-xs font-extrabold tracking-[0.2em] text-[#C96632] sm:text-sm">
        THE DAD CLUB PROGRAM
      </p>

      <h2 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-tight md:text-6xl">
        FIVE SESSIONS.
        <br />
        ONE BIG JOURNEY.
      </h2>

      <p className="mt-7 max-w-2xl text-base leading-relaxed text-[#52645A] sm:text-lg">
        From six months before birth to your child&apos;s second
        birthday, The Dad Club brings fathers together at five key
        moments. Each session offers an opportunity to connect,
        share experiences and prepare for what&apos;s next.
      </p>

      <div className="relative mt-16">
        <div className="absolute bottom-8 left-6 top-8 w-[2px] bg-[#173A2C]/15 md:left-10" />

        <div className="space-y-6">
          {sessionInformation.map((session) => {
            const number = String(session.number).padStart(2, "0");

            return (
              <div
                key={session.slug}
                className="relative grid grid-cols-[48px_1fr] gap-5 md:grid-cols-[80px_1fr] md:gap-8"
              >
                <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-[#173A2C] text-sm font-black text-[#F4F0E5] md:h-20 md:w-20 md:text-xl">
                  {number}
                </div>

                <Link
                  href={`/sessions/${session.slug}`}
                  aria-label={`Explore ${session.title}, ${session.timing}`}
                  className="block rounded-[28px] border border-[#173A2C]/10 bg-[#FBF8F0] p-6 transition hover:border-[#C96632]/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632] md:p-10"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <p className="text-xs font-extrabold tracking-[0.14em] text-[#C96632] sm:text-sm">
                      {session.timing.toUpperCase()}
                    </p>

                    <span className="rounded-full bg-[#E8EBDD] px-4 py-2 text-[10px] font-extrabold tracking-[0.1em] text-[#173A2C]">
                      {sessionTags[session.number]}
                    </span>
                  </div>

                  <h3 className="mt-5 text-2xl font-black tracking-tight md:text-4xl">
                    {session.title}
                  </h3>

                  <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#52645A] md:text-lg">
                    {session.description}
                  </p>

                  <p className="mt-8 text-xs font-extrabold tracking-wide text-[#173A2C]">
                    EXPLORE SESSION {number} →
                  </p>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-14 rounded-[28px] bg-[#E8EBDD] p-8 md:p-12">
        <p className="text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
          MORE THAN JUST FIVE SESSIONS
        </p>

        <h3 className="mt-5 max-w-2xl text-3xl font-black leading-tight md:text-4xl">
          A community that grows with you.
        </h3>

        <p className="mt-5 max-w-2xl text-base leading-relaxed text-[#52645A] md:text-lg">
          The sessions are milestones, not the whole story. The Dad
          Club is about building connections and giving dads a
          place to return to as fatherhood changes.
        </p>
      </div>
    </section>
  );
}