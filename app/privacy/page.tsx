import Link from "next/link";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";

const policies = [
  {
    href: "/privacy/website",
    label: "THE WEBSITE",
    title: "Website privacy",
    description:
      "How we handle details provided through our website, including registrations of interest and enquiries.",
    status: "Current development version",
  },
  {
    href: "/privacy/app",
    label: "THE APP",
    title: "App privacy",
    description:
      "Privacy information for The Dad Club mobile app, separate from website registrations.",
    status: "Policy being finalised",
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F4F0E5] text-[#173A2C]">
      <SiteHeader />

      <main className="mx-auto max-w-5xl px-5 py-14 md:px-10 md:py-24">
        <p className="text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
          YOUR INFORMATION
        </p>

        <h1 className="mt-5 text-4xl font-black tracking-tight md:text-6xl">
          LET&apos;S KEEP IT CLEAR.
        </h1>

        <p className="mt-7 max-w-2xl text-base leading-relaxed text-[#52645A] sm:text-lg">
          The website and app serve different purposes. Choose the
          privacy information relevant to the service you use.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {policies.map((policy) => (
            <Link
              key={policy.href}
              href={policy.href}
              className="flex flex-col rounded-[28px] border border-[#173A2C]/15 bg-[#FBF8F0] p-7 transition hover:border-[#C96632] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632] sm:p-9"
            >
              <p className="text-xs font-extrabold tracking-[0.16em] text-[#C96632]">
                {policy.label}
              </p>

              <h2 className="mt-5 text-3xl font-black tracking-tight">
                {policy.title}
              </h2>

              <p className="mt-4 flex-1 leading-relaxed text-[#52645A]">
                {policy.description}
              </p>

              <p className="mt-6 text-xs text-[#52645A]">
                {policy.status}
              </p>

              <p className="mt-5 text-sm font-extrabold">
                VIEW DETAILS →
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-10 rounded-[28px] bg-[#E8EBDD] p-7">
          <h2 className="text-xl font-black">A question about privacy?</h2>
          <a
            href="mailto:hello@thedadclub.com.au"
            className="mt-4 inline-block break-all text-sm font-semibold underline underline-offset-4"
          >
            hello@thedadclub.com.au
          </a>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}