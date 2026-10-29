"use client";

import { useFormStatus } from "react-dom";

export default function MemberWaitlistButton({
  leaving = false,
}: {
  leaving?: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full border border-[#173A2C]/30 px-5 py-3 text-sm font-bold transition hover:bg-[#E8EBDD] disabled:cursor-wait disabled:opacity-60"
    >
      {pending
        ? "PLEASE WAIT…"
        : leaving
          ? "Leave waitlist"
          : "JOIN WAITLIST →"}
    </button>
  );
}