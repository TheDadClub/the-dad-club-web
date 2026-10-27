import Link from "next/link";

const links = [
  { href: "/#about", label: "ABOUT" },
  { href: "/#program", label: "THE PROGRAM" },
  { href: "/app", label: "THE APP" },
  { href: "/faq", label: "FAQs" },
  { href: "mailto:hello@thedadclub.com.au", label: "CONTACT" },
];

export default function SiteHeader() {
  return (
    <header className="relative z-50 border-b border-[#173A2C]/10 bg-[#F4F0E5] text-[#173A2C]">
      {/* Desktop navigation */}
      <nav
        aria-label="Main navigation"
        className="mx-auto hidden max-w-7xl items-center justify-between gap-5 px-10 py-6 lg:flex"
      >
        <Link
          href="/"
          className="shrink-0 text-xl font-black tracking-tight"
        >
          THE DAD CLUB <span className="text-[#C96632]">→</span>
        </Link>

        <div className="flex items-center gap-6 text-xs font-extrabold">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition hover:text-[#C96632]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <Link
          href="/join"
          className="shrink-0 rounded-full bg-[#173A2C] px-6 py-3 text-xs font-extrabold text-[#F4F0E5] transition hover:bg-[#245540]"
        >
          JOIN THE CLUB →
        </Link>
      </nav>

      {/* Mobile navigation */}
      <nav
        aria-label="Mobile navigation"
        className="relative px-5 py-5 md:px-10 lg:hidden"
      >
        <Link
          href="/"
          className="relative z-10 inline-flex min-h-12 items-center text-lg font-black tracking-tight sm:text-xl"
        >
          THE DAD CLUB <span className="ml-2 text-[#C96632]">→</span>
        </Link>

        <details className="group">
          <summary className="absolute right-5 top-5 flex min-h-12 cursor-pointer list-none items-center justify-center gap-3 rounded-full border border-[#173A2C]/25 bg-[#F4F0E5] px-5 text-xs font-extrabold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632] md:right-10 [&::-webkit-details-marker]:hidden">
            <span className="group-open:hidden">
              MENU <span aria-hidden="true">+</span>
            </span>

            <span className="hidden group-open:inline">
              CLOSE <span aria-hidden="true">×</span>
            </span>
          </summary>

          <div className="mt-5 border-t border-[#173A2C]/15 pb-1 pt-3">
            <div className="flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex min-h-12 items-center rounded-xl px-4 py-3 text-sm font-extrabold hover:bg-[#E8EBDD] active:bg-[#E8EBDD]"
                >
                  {link.label}
                </Link>
              ))}

              <Link
                href="/join"
                className="mt-3 rounded-full bg-[#173A2C] px-6 py-4 text-center text-xs font-extrabold text-[#F4F0E5] hover:bg-[#245540]"
              >
                REGISTER YOUR INTEREST →
              </Link>
            </div>
          </div>
        </details>
      </nav>
    </header>
  );
}