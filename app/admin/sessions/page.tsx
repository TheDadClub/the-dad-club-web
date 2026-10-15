import { Suspense } from "react";
import type { Metadata } from "next";
import SessionManager from "../../../components/SessionManager";

export const metadata: Metadata = {
  title: "Session management | The Dad Club",
  robots: {
    index: false,
    follow: false,
  },
};

type SearchParams = Promise<{
  edit?: string | string[];
  error?: string | string[];
  saved?: string | string[];
}>;

export default function SessionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F4F0E5] px-6 py-16 text-[#173A2C]">
          <p className="text-lg font-bold">Loading session management…</p>
        </main>
      }
    >
      <SessionManager searchParams={searchParams} />
    </Suspense>
  );
}