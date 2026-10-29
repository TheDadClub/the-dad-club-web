"use client";

import { useFormStatus } from "react-dom";

export default function MemberBookButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-5 rounded-full bg-[#173A2C] px-6 py-3 text-sm font-extrabold text-[#F4F0E5] transition hover:bg-[#245540] disabled:cursor-wait disabled:opacity-60"
    >
      {pending ? "BOOKING YOUR PLACE…" : "BOOK THIS SESSION →"}
    </button>
  );
}