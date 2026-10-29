import { Suspense } from "react";
import type { Metadata } from "next";
import MemberDashboard, {
  type MemberSearchParams,
} from "../../components/MemberDashboard";

export const metadata: Metadata = {
  title: "Your membership | The Dad Club",
  robots: {
    index: false,
    follow: false,
  },
};

export default function MembersPage({
  searchParams,
}: {
  searchParams: MemberSearchParams;
}) {
  return (
    <div className="min-h-screen bg-[#F4F0E5] text-[#173A2C]">
      <Suspense
        fallback={
          <main className="mx-auto max-w-6xl px-5 py-16 md:px-10">
            <p role="status" className="font-bold">
              Opening your membership…
            </p>
          </main>
        }
      >
        <MemberDashboard searchParams={searchParams} />
      </Suspense>
    </div>
  );
}