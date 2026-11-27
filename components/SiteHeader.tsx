import Link from "next/link";

const links = [
  { href: "/#program", label: "THE PROGRAM" },
  { href: "/app", label: "THE APP" },
  { href: "/events/pints-and-ponytails", label: "EVENTS" },
  { href: "/gift", label: "GIFT A DAD" },
];

const focusClass =
  "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]";

export default function SiteHeader() {
  return (
    <header className="relative z-50 border-b border-[#173A2C]/10 bg-[#F4F0E5] text-[#173A2C]">
      <nav
        aria-label="Main navigation"
        className="mx-auto hidden max-w-7xl items-center gap-6 px-10 py-6 xl:flex"
      >
        <Link
          href="/"
          className={`shrink-0 whitespace-nowrap text-xl font-black tracking-tight ${focusClass}`}
        >
          THE DAD CLUB <span className="text-[#C96632]">→</span>
        </Link>

        <ul className="ml-auto flex items-center text-xs font-extrabold">
          {links.map((link, index) => (
            <li key={link.href} className="flex items-center">
              {index > 0 && (
                <span
                  aria-hidden="true"
                  className="mx-3 h-3 w-px shrink-0 bg-[#173A2C]/25"
                />
              )}
              <Link
                href={link.href}
                className={`inline-flex min-h-12 items-center whitespace-nowrap transition hover:text-[#C96632] ${focusClass}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex shrink-0 items-center gap-3">
          <Link
            href="/members/login"
            prefetch={false}
            className={`inline-flex min-h-12 items-center whitespace-nowrap rounded-full border border-[#173A2C]/20 px-4 py-3 text-xs font-extrabold transition hover:bg-[#E8EBDD] ${focusClass}`}
          >
            MEMBER LOGIN
          </Link>
          <Link
            href="/join"
            className={`inline-flex min-h-12 items-center gap-2 whitespace-nowrap rounded-full bg-[#173A2C] px-6 py-3 text-xs font-extrabold text-[#F4F0E5] transition hover:bg-[#245540] ${focusClass}`}
          >
            GET SESSION UPDATES <span aria-hidden="true">→</span>
          </Link>
        </div>
      </nav>

      <nav
        aria-label="Mobile navigation"
        className="relative px-4 py-4 sm:px-5 md:px-10 xl:hidden"
      >
        <Link
          href="/"
          className={`inline-flex min-h-12 items-center gap-1.5 whitespace-nowrap text-base font-black tracking-tight sm:text-xl ${focusClass}`}
        >
          THE DAD CLUB <span className="text-[#C96632]">→</span>
        </Link>

        <details className="group">
          <summary
            className={`absolute right-4 top-4 flex min-h-12 cursor-pointer list-none items-center justify-center whitespace-nowrap rounded-full border border-[#173A2C]/25 bg-[#F4F0E5] px-4 text-xs font-extrabold sm:right-5 md:right-10 [&::-webkit-details-marker]:hidden ${focusClass}`}
          >
            <span className="group-open:hidden">
              MENU <span aria-hidden="true">+</span>
            </span>
            <span className="hidden group-open:inline">
              CLOSE <span aria-hidden="true">×</span>
            </span>
          </summary>

          <div className="mt-4 border-t border-[#173A2C]/15 pt-3">
            <div className="flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex min-h-12 items-center rounded-xl px-4 py-3 text-sm font-extrabold hover:bg-[#E8EBDD] ${focusClass}`}
                >
                  {link.label}
                </Link>
              ))}

              <Link
                href="/members/login"
                prefetch={false}
                className={`mt-3 flex min-h-12 items-center justify-center rounded-full border border-[#173A2C]/20 px-4 py-3 text-center text-xs font-extrabold hover:bg-[#E8EBDD] ${focusClass}`}
              >
                MEMBER LOGIN
              </Link>
              <Link
                href="/join"
                className={`mt-2 flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#173A2C] px-4 py-3 text-center text-xs font-extrabold text-[#F4F0E5] hover:bg-[#245540] ${focusClass}`}
              >
                GET SESSION UPDATES <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </details>
      </nav>
    </header>
  );
}