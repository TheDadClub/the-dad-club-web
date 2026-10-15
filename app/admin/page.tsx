import { Suspense } from "react";
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
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F4F0E5] px-6 py-16 text-[#173A2C]">
          <p className="text-lg font-bold">Loading administration…</p>
        </main>
      }
    >
      <AdminDashboard searchParams={searchParams} />
    </Suspense>
  );
}