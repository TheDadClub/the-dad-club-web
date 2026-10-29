"use client";

import { useActionState } from "react";
import {
  memberLogin,
  type MemberLoginState,
} from "../app/members/actions";
import Turnstile from "./Turnstile";

const initialState: MemberLoginState = {
  step: "email",
  email: "",
  error: "",
  attempt: 0,
};

const inputClass =
  "mt-2 w-full rounded-2xl border border-[#173A2C]/20 bg-[#FBF8F0] px-4 py-3.5 text-base text-[#173A2C] focus:border-[#C96632] focus:outline-none focus:ring-2 focus:ring-[#C96632]/25";

export default function MemberLoginForm() {
  const [state, formAction, pending] = useActionState(
    memberLogin,
    initialState,
  );

  const enteringCode = state.step === "code";

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
        {enteringCode ? "Check your inbox." : "Welcome back to the club."}
      </h1>

      <p className="mt-5 leading-relaxed text-[#52645A]">
        {enteringCode
          ? "If this email matches an active membership, we'll send a one-time login code. Check your inbox and junk folder."
          : "Enter the email address attached to your membership. We'll email you a one-time code—no password to remember."}
      </p>

      {enteringCode && (
        <p className="mt-3 break-all font-bold">{state.email}</p>
      )}

      {state.error && (
        <p
          role="alert"
          className="mt-6 rounded-2xl bg-[#C96632]/10 p-4 text-sm leading-relaxed"
        >
          {state.error}
        </p>
      )}

      <form action={formAction} className="mt-7 space-y-6">
        <input
          type="hidden"
          name="intent"
          value={enteringCode ? "verify" : "request"}
        />

        {enteringCode ? (
          <>
            <input type="hidden" name="email" value={state.email} />

            <div>
              <label htmlFor="member-code" className="text-sm font-bold">
                Login code
              </label>
              <input
                id="member-code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={20}
                autoFocus
                className={`${inputClass} text-center text-2xl tracking-[0.2em]`}
              />
            </div>
          </>
        ) : (
          <>
            <div>
              <label htmlFor="member-email" className="text-sm font-bold">
                Email address
              </label>
              <input
                id="member-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                defaultValue={state.email}
                className={inputClass}
              />
            </div>

            <Turnstile
              key={state.attempt}
              action="member_login"
            />
          </>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-[#173A2C] px-6 py-4 text-sm font-extrabold text-[#F4F0E5] transition hover:bg-[#245540] disabled:cursor-wait disabled:opacity-60"
        >
          {pending
            ? "PLEASE WAIT…"
            : enteringCode
              ? "SIGN IN →"
              : "EMAIL ME A CODE →"}
        </button>

        {enteringCode && (
          <a
            href="/members/login"
            className="block text-center text-sm font-bold underline underline-offset-4"
          >
            Request a new code or use another email
          </a>
        )}
      </form>

      <p className="mt-7 text-sm leading-relaxed text-[#52645A]">
        Need help accessing your membership?{" "}
        <a
          href="mailto:hello@thedadclub.com.au"
          className="underline underline-offset-4"
        >
          Contact The Dad Club
        </a>
        .
      </p>
    </div>
  );
}