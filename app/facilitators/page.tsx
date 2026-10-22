import type { Metadata } from "next";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";

export const metadata: Metadata = {
  title: "Facilitate with The Dad Club",
  description:
    "Explore paid opportunities to support first-time fathers through online and face-to-face Dad Club groups, with training and ongoing support.",
};

const expectations = [
  {
    title: "Make room for honest conversations.",
    description:
      "Guide structured group conversations about adjusting to fatherhood, identity, relationships, wellbeing and connection. Help people feel welcome and heard, without pressure to share or have all the answers.",
  },
  {
    title: "Train, practise and keep learning.",
    description:
      "Complete mandatory initial training and a readiness assessment before leading groups. Take part in refresher training and ongoing support to keep your facilitation skills and program knowledge current.",
  },
  {
    title: "Be someone the group can count on.",
    description:
      "Prepare for sessions, honour accepted commitments, arrive on time and communicate early if circumstances change. Follow the program, professional conduct expectations and agreed reporting procedures.",
  },
  {
    title: "Know the boundaries of the role.",
    description:
      "Respect privacy, maintain appropriate boundaries and follow safeguarding and escalation procedures. These groups focus on connection and adjustment to fatherhood; they are not individual therapy or a substitute for clinical care.",
  },
];

export default function FacilitatorsPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F4F0E5] text-[#173A2C]">
      <SiteHeader />

      <main id="main-content">
        <section className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-24">
          <p className="text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
            FACILITATE WITH THE DAD CLUB
          </p>

          <h1 className="mt-6 max-w-4xl text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl md:text-6xl">
            GOOD WITH DADS?
            <br />
            GET PAID FOR IT.
          </h1>

          <p className="mt-8 max-w-3xl text-lg leading-relaxed text-[#52645A]">
            Help first-time fathers navigate a big life change. We are
            inviting expressions of interest from people who can bring
            warmth, sound judgement and thoughtful facilitation to
            conversations about fatherhood and wellbeing.
          </p>

          <a
            href="#express-interest"
            className="mt-8 inline-block rounded-full bg-[#173A2C] px-7 py-4 text-sm font-extrabold text-[#F4F0E5] transition hover:bg-[#245540] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#173A2C]"
          >
            EXPRESS YOUR INTEREST →
          </a>

          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#52645A]">
            Opportunities are paid. Rates, employment terms and available
            work will be confirmed before any commitment. Expressing
            interest does not guarantee an appointment or sessions.
          </p>
        </section>

        <section className="bg-[#E8EBDD] px-5 py-16 md:px-10 md:py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">
              Connection starts with a good facilitator.
            </h2>

            <p className="mt-6 max-w-3xl leading-relaxed text-[#52645A]">
              Our five-session journey supports first-time fathers from
              24 weeks before birth to 24 months after. Facilitators help
              adults explore their own adjustment and mental wellbeing,
              rather than teach baby care or prescribe a way to parent.
            </p>

            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {expectations.map((item) => (
                <article
                  key={item.title}
                  className="rounded-[24px] bg-[#FBF8F0] p-6 sm:p-8"
                >
                  <h3 className="text-xl font-black">{item.title}</h3>

                  <p className="mt-4 leading-relaxed text-[#52645A]">
                    {item.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 md:px-10 md:py-20">
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">
            Different backgrounds. A shared purpose.
          </h2>

          <p className="mt-6 max-w-3xl leading-relaxed text-[#52645A]">
            You do not need to be a dad or a former participant to express
            interest. Relevant experience might include group facilitation,
            education, community work, peer support or supporting people
            through change. Tell us about the experience and qualities
            you would bring.
          </p>

          <p className="mt-5 max-w-3xl leading-relaxed text-[#52645A]">
            Selection will include a suitability assessment, relevant
            references and any role-specific checks or credentials
            required for the work. Requirements will be explained during
            recruitment. Appointment and completion of required training
            must come before independent session delivery.
          </p>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <article className="rounded-[24px] border border-[#173A2C]/15 p-6 sm:p-8">
              <h3 className="text-xl font-black">Online facilitation</h3>

              <p className="mt-4 leading-relaxed text-[#52645A]">
                Guide groups using Microsoft Teams. You will need a
                suitable device, reliable internet, a private space and
                confidence sharing presentation materials. Online delivery
                readiness will be checked as part of preparation.
              </p>
            </article>

            <article className="rounded-[24px] border border-[#173A2C]/15 p-6 sm:p-8">
              <h3 className="text-xl font-black">
                Face-to-face facilitation
              </h3>

              <p className="mt-4 leading-relaxed text-[#52645A]">
                Bring groups together at approved venues. Let us know
                your preferred service areas and travel availability.
                Presentation equipment and device arrangements will be
                agreed before accepting work.
              </p>
            </article>
          </div>

          <p className="mt-5 text-sm text-[#52645A]">
            You can express interest in either delivery mode, or both.
          </p>
        </section>

        <section
          id="express-interest"
          className="scroll-mt-6 bg-[#173A2C] px-5 py-16 text-[#F4F0E5] md:px-10 md:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-black tracking-tight md:text-4xl">
              Interested? Start a conversation.
            </h2>

            <p className="mt-6 max-w-3xl leading-relaxed text-[#D8E1D8]">
              Our online application form is being prepared. In the
              meantime, email a short introduction, your location,
              relevant experience and whether you are interested in
              online facilitation, face-to-face sessions or both.
            </p>

            <a
              href="mailto:hello@thedadclub.com.au?subject=Facilitator%20expression%20of%20interest"
              className="mt-8 inline-block rounded-full bg-[#F4F0E5] px-7 py-4 text-sm font-extrabold text-[#173A2C] transition hover:bg-[#E8EBDD] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F4F0E5]"
            >
              EMAIL YOUR INTEREST →
            </a>

            <p className="mt-5 break-words text-sm text-[#D8E1D8]">
              hello@thedadclub.com.au
            </p>

            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-[#D8E1D8]">
              Please do not send bank details, identity documents,
              screening documents or personal health information.
              Any required documents will be requested later through
              an appropriate secure process.
            </p>

            <a
              href="/privacy/website"
              className="mt-5 inline-block text-sm font-bold underline underline-offset-4"
            >
              Website privacy notice
            </a>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}