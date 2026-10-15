import Link from "next/link";

const footerLinks = [
  { href: "/#about", label: "About" },
  { href: "/#program", label: "The program" },
  { href: "/#app", label: "The app" },
  { href: "/faq", label: "FAQs" },
  { href: "/join", label: "Register interest" },
  { href: "/privacy", label: "Privacy Policy" },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#173A2C]/10 bg-[#F4F0E5] px-5 py-10 text-[#173A2C] md:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-8 md:flex-row">
          <div>
            <Link href="/" className="text-lg font-black tracking-tight">
              THE DAD CLUB <span className="text-[#C96632]">→</span>
            </Link>

            <p className="mt-3 max-w-sm text-sm leading-relaxed text-[#52645A]">
              Supporting first-time fathers through the transition
              to fatherhood.
            </p>

            <a
              href="mailto:hello@thedadclub.com.au"
              className="mt-4 inline-block break-words text-sm font-semibold hover:text-[#C96632]"
            >
              hello@thedadclub.com.au
            </a>
          </div>

          <nav
            aria-label="Footer navigation"
            className="grid grid-cols-2 gap-x-8 gap-y-1 self-start text-sm font-semibold"
          >
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex min-h-11 items-center hover:text-[#C96632]"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-8 border-t border-[#173A2C]/10 pt-6 text-xs leading-relaxed text-[#52645A]">
          Real dads. Real conversations. No perfect answers.
        </p>
      </div>
    </footer>
  );
}