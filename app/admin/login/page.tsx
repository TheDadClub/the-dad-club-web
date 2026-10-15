import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { signIn, signOut } from "../actions";

export const metadata: Metadata = {
  title: "Admin sign-in | The Dad Club",
  robots: {
    index: false,
    follow: false,
  },
};

type SearchParams = Promise<{
  error?: string | string[];
}>;

async function LoginForm({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;

  const message =
    params.error === "credentials"
      ? "Unable to sign in. Check your email and password."
      : params.error === "access"
        ? "This account does not have administrator access."
        : null;

  const inputClass =
    "mt-2 w-full rounded-2xl border border-[#173A2C]/20 bg-[#FBF8F0] px-4 py-3.5 text-base focus:border-[#C96632] focus:outline-none focus:ring-2 focus:ring-[#C96632]/25";

  return (
    <>
      {message && (
        <p
          role="alert"
          className="mt-6 rounded-2xl bg-[#C96632]/10 p-4 text-sm leading-relaxed"
        >
          {message}
        </p>
      )}

      <form action={signIn} className="mt-8 space-y-6">
        <div>
          <label htmlFor="email" className="text-sm font-bold">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            required
            maxLength={254}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-bold">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            maxLength={1024}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-full bg-[#173A2C] px-6 py-4 text-sm font-extrabold text-[#F4F0E5] hover:bg-[#245540]"
        >
          SIGN IN →
        </button>
      </form>

      {params.error === "access" && (
        <form action={signOut} className="mt-5">
          <button
            type="submit"
            className="text-sm font-semibold underline underline-offset-4"
          >
            Sign out of this account
          </button>
        </form>
      )}
    </>
  );
}

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className="min-h-screen bg-[#F4F0E5] px-5 py-12 text-[#173A2C]">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-lg font-black tracking-tight">
          THE DAD CLUB <span className="text-[#C96632]">→</span>
        </Link>

        <div className="mt-10 rounded-[28px] border border-[#173A2C]/15 bg-white/60 p-7 sm:p-9">
          <p className="text-xs font-extrabold tracking-[0.16em] text-[#C96632]">
            ADMINISTRATION
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-tight">
            Welcome back.
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-[#52645A]">
            Sign in with your authorised administrator account.
          </p>

          <Suspense fallback={<p className="mt-6">Loading sign-in…</p>}>
            <LoginForm searchParams={searchParams} />
          </Suspense>
        </div>

        <Link
          href="/"
          className="mt-7 inline-block text-sm font-semibold"
        >
          ← Back to the website
        </Link>
      </div>
    </main>
  );
}