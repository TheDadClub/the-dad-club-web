import Link from "next/link";

const exploreLinks = [
  { href: "/#about", label: "About" },
  { href: "/#program", label: "The program" },
  { href: "/app", label: "The app" },
  { href: "/faq", label: "FAQs" },
  { href: "/join", label: "Register interest" },
];

const involvementLinks = [
  { href: "/venues", label: "Venue partnerships" },
  { href: "/facilitators", label: "Become a facilitator" },
];

const accountLinks = [
  { href: "/members/login", label: "Member login" },
  { href: "/admin/login", label: "Admin login" },
];

const linkClass =
  "flex min-h-11 items-center text-sm font-semibold transition hover:text-[#C96632] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C96632]";

const headingClass =
  "mb-3 text-xs font-extrabold tracking-[0.14em] text-[#52645A]";

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#173A2C]/10 bg-[#F4F0E5] px-5 py-10 text-[#173A2C] md:px-10 md:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_2fr] lg:gap-16">
          <div>
            <Link
              href="/"
              className="text-lg font-black tracking-tight"
            >
              THE DAD CLUB{" "}
              <span className="text-[#C96632]">→</span>
            </Link>

            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#52645A]">
              Supporting first-time fathers through the transition
              to fatherhood.
            </p>

            <a
              href="mailto:hello@thedadclub.com.au"
              className="mt-4 inline-flex min-h-11 items-center break-all text-sm font-semibold hover:text-[#C96632]"
            >
              hello@thedadclub.com.au
            </a>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 sm:gap-x-8">
            <nav aria-label="Explore The Dad Club">
              <h2 className={headingClass}>EXPLORE</h2>

              {exploreLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={linkClass}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <nav aria-label="Get involved">
              <h2 className={headingClass}>GET INVOLVED</h2>

              {involvementLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={linkClass}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <nav aria-label="Account access">
              <h2 className={headingClass}>LOGIN</h2>

              {accountLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  className={linkClass}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-[#173A2C]/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-relaxed text-[#52645A]">
            Real dads. Real conversations. No perfect answers.
          </p>

          <Link
            href="/privacy"
            className="inline-flex min-h-11 items-center self-start text-xs font-semibold text-[#52645A] hover:text-[#C96632] sm:self-auto"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}