"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "../app/admin/actions";

const sections = [
  { href: "/admin", label: "Interest registrations" },
  { href: "/admin/members", label: "Members" },
  { href: "/admin/sessions", label: "Sessions" },
];

export default function AdminNavigation() {
  const pathname = usePathname();

  if (!pathname || pathname.startsWith("/admin/login")) {
    return null;
  }

  return (
    <>
      <header className="bg-[#173A2C] text-[#F4F0E5]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-5 py-6 md:px-10">
          <Link
            href="/admin"
            prefetch={false}
            className="text-lg font-black"
          >
            THE DAD CLUB → ADMIN
          </Link>

          <div className="flex items-center gap-5 text-sm font-semibold">
            <Link
              href="/"
              prefetch={false}
              className="underline underline-offset-4"
            >
              View website
            </Link>

            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-[#F4F0E5]/40 px-5 py-3 transition hover:bg-white/10"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <nav
        aria-label="Admin sections"
        className="border-b border-[#173A2C]/15 bg-[#E8EBDD] text-[#173A2C]"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap gap-2 px-5 py-4 md:px-10">
          {sections.map((section) => {
            const active =
              section.href === "/admin"
                ? pathname === "/admin"
                : pathname === section.href ||
                  pathname.startsWith(`${section.href}/`);

            return (
              <Link
                key={section.href}
                href={section.href}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-4 py-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C96632] ${
                  active
                    ? "bg-[#173A2C] text-[#F4F0E5]"
                    : "hover:bg-[#173A2C]/10"
                }`}
              >
                {section.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}