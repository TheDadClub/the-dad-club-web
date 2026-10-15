import type { Metadata } from "next";
import { Suspense } from "react";
import MemberManager, {
  type MemberSearchParams,
} from "../../../components/MemberManager";

export const metadata: Metadata = {
  title: "Members | The Dad Club Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MembersPage({
  searchParams,
}: {
  searchParams: Promise<MemberSearchParams>;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F4F0E5] px-5 py-12 text-[#173A2C]">
          <p className="mx-auto max-w-6xl font-bold">
            Loading member management…
          </p>
        </main>
      }
    >
      <MemberManager searchParams={searchParams} />
    </Suspense>
  );
}