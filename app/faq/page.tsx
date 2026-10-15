import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";

const questions = [
  {
    question: "Who is The Dad Club for?",
    answer:
      "The Dad Club is designed for first-time fathers, from pregnancy through their child's second birthday. It's a space to explore how becoming a father affects you: your identity, relationships, mental health and everyday life.",
  },
  {
    question: "What do you talk about?",
    answer:
      "We focus on the transition to fatherhood: expectations, changing relationships, connection, stress, identity and looking after your wellbeing. There's room for the good parts, the difficult parts and the things you didn't expect.",
  },
  {
    question: "Will I learn how to look after a baby?",
    answer:
      "The focus is on you and your adjustment to becoming a father. Baby care, feeding and sleep advice are outside the program's focus. The Dad Club complements the support you receive from maternity, child health and other services.",
  },
  {
    question: "When are the five sessions?",
    answer:
      "The program follows five key moments: 24 weeks before birth, 12 weeks before birth, three months after birth, 12 months after birth and 24 months after birth. These are guideposts for the journey; specific session dates will be confirmed when programs are available.",
  },
  {
    question: "What if I've already passed the first session?",
    answer:
      "You can still register your interest. Let us know where you are in your fatherhood journey so we can discuss which upcoming options might suit you.",
  },
  {
    question: "Do I have to talk in front of the group?",
    answer:
      "You can contribute at your own pace. You're welcome to listen, and you don't need to share anything you're uncomfortable discussing.",
  },
  {
    question: "Do I need to be struggling to attend?",
    answer:
      "No. You might be excited, overwhelmed, going well or feeling a bit of everything. The Dad Club gives you space to connect and reflect wherever you're at.",
  },
  {
    question: "Is The Dad Club therapy?",
    answer:
      "The Dad Club is a support and education program focused on the transition to fatherhood. It doesn't provide individual therapy, diagnosis or crisis care, and it can sit alongside professional mental health support.",
  },
  {
    question: "Where are sessions held?",
    answer:
      "Venues and session dates are still being finalised. Include your suburb or town when you register your interest so we know where dads would like to attend.",
  },
  {
    question: "How much does it cost?",
    answer:
      "Program pricing will be confirmed before bookings open. Registering your interest is free and doesn't commit you to attending or paying for anything.",
  },
  {
    question: "How does the app fit in?",
    answer:
      "The Dad Club app is designed to support you between sessions, with content about adjusting to fatherhood, wellbeing check-ins and links to support. App availability and access details will be confirmed before enrolment.",
  },
  {
    question: "Can I enquire on behalf of someone else?",
    answer:
      "Yes. You can ask about the program for a partner, family member or friend. Use your own contact details when enquiring, and let them decide whether they'd like to get involved.",
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#F4F0E5] text-[#173A2C]">
      <SiteHeader />

      <main>
        <section className="mx-auto max-w-4xl px-5 py-14 md:px-10 md:py-24">
          <p className="text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
            GOOD QUESTIONS
          </p>

          <h1 className="mt-5 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            A FEW THINGS
            <br />
            YOU MIGHT BE WONDERING.
          </h1>

          <p className="mt-7 max-w-2xl text-base leading-relaxed text-[#52645A] sm:text-lg">
            What happens? Who&apos;s it for? Do you need to have it all
            figured out? Here&apos;s a little more about The Dad Club.
            And no, you definitely don&apos;t.
          </p>

          <div className="mt-12 space-y-4">
            {questions.map((item) => (
              <details
                key={item.question}
                className="group rounded-2xl border border-[#173A2C]/15 bg-[#FBF8F0] open:border-[#C96632]/50"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 rounded-2xl p-5 text-base font-extrabold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632] sm:p-7 sm:text-lg [&::-webkit-details-marker]:hidden">
                  <span>{item.question}</span>

                  <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#E8EBDD] text-xl text-[#173A2C]"
                  >
                    <span className="group-open:hidden">+</span>
                    <span className="hidden group-open:inline">−</span>
                  </span>
                </summary>

                <div className="px-5 pb-6 sm:px-7 sm:pb-7">
                  <p className="max-w-2xl text-base leading-relaxed text-[#52645A]">
                    {item.answer}
                  </p>
                </div>
              </details>
            ))}
          </div>

          <div className="mt-12 rounded-[28px] bg-[#173A2C] p-7 text-[#F4F0E5] sm:p-10">
            <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
              Still have a question?
            </h2>

            <p className="mt-4 leading-relaxed text-[#D8E1D8]">
              Get in touch, or put your hand up to hear about upcoming
              programs.
            </p>

            <div className="mt-7 flex flex-wrap gap-4">
              <Link
                href="/join"
                className="rounded-full bg-[#F4F0E5] px-6 py-4 text-xs font-extrabold text-[#173A2C] transition hover:bg-[#E8EBDD]"
              >
                REGISTER YOUR INTEREST →
              </Link>

              <a
                href="mailto:hello@thedadclub.com.au"
                className="rounded-full border border-[#F4F0E5]/50 px-6 py-4 text-xs font-extrabold transition hover:bg-[#F4F0E5]/10"
              >
                ASK A QUESTION
              </a>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}