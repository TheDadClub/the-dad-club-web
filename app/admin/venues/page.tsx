import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "../../../lib/admin";

export const metadata: Metadata = {
  title: "Venue partnerships | The Dad Club Admin",
  robots: {
    index: false,
    follow: false,
  },
};

async function VenueAdministration() {
  await requireAdmin();

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 text-[#173A2C] md:px-10">
      <p className="text-xs font-extrabold tracking-[0.16em] text-[#C96632]">
        VENUE PARTNERSHIPS
      </p>

      <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
        Venue administration
      </h1>

      <div className="mt-8 rounded-[24px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6 sm:p-8">
        <h2 className="text-xl font-black">
          Public venue enquiries
        </h2>

        <p className="mt-4 max-w-2xl leading-relaxed text-[#52645A]">
          Venues can express interest through the public venue
          partnership page. Reviewing and managing enquiries
          within this admin page is not yet available.
        </p>

        <Link
          href="/venues"
          prefetch={false}
          className="mt-6 inline-flex min-h-12 items-center rounded-full bg-[#173A2C] px-6 py-3 text-sm font-extrabold text-[#F4F0E5] transition hover:bg-[#245540] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632]"
        >
          VIEW PUBLIC VENUE PAGE →
        </Link>
      </div>
    </main>
  );
}

export default function AdminVenuesPage() {
  return (
    <div className="min-h-screen bg-[#F4F0E5]">
      <Suspense
        fallback={
          <main className="mx-auto max-w-6xl px-5 py-10 text-[#173A2C] md:px-10">
            <p role="status" className="font-bold">
              Loading venue administration…
            </p>
          </main>
        }
      >
        <VenueAdministration />
      </Suspense>
    </div>
  );
}