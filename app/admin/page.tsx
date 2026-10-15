import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import AdminDashboard from "../../components/AdminDashboard";

export const metadata: Metadata = {
  title: "Admin dashboard | The Dad Club",
  robots: {
    index: false,
    follow: false,
  },
};

type SearchParams = Promise<{
  page?: string | string[];
}>;

export default function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <>
      <nav
        aria-label="Admin sections"
        className="flex flex-wrap gap-6 border-b border-[#173A2C]/15 bg-[#E8EBDD] px-5 py-4 text-sm font-bold text-[#173A2C] md:px-10"
      >
        <Link href="/admin" aria-current="page" prefetch={false}>
          Interest list
        </Link>
        <Link href="/admin/sessions" prefetch={false}>
          Session management →
        </Link>
      </nav>

      <Suspense
        fallback={
          <main className="min-h-screen bg-[#F4F0E5] px-6 py-16 text-[#173A2C]">
            <p className="text-lg font-bold">Loading administration…</p>
          </main>
        }
      >
        <AdminDashboard searchParams={searchParams} />
      </Suspense>
    </>
  );
}