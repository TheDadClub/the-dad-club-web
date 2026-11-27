import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import VenueEnquiries, {
  type VenueSearchParams,
} from "../../../components/VenueEnquiries";

export const metadata: Metadata = {
  title: "Venue enquiries | The Dad Club Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminVenuesPage({
  searchParams,
}: {
  searchParams: VenueSearchParams;
}) {
  return (
    <div className="min-h-screen bg-[#F4F0E5]">
      <div className="mx-auto max-w-6xl px-5 pt-8 text-[#173A2C] md:px-10">
        <nav
          aria-label="Venue management"
          className="flex flex-wrap gap-3"
        >
          <Link
            href="/admin/venues/outreach"
            prefetch={false}
            className="rounded-full border border-[#173A2C]/20 bg-white px-5 py-3 text-sm font-bold hover:bg-[#E8EBDD]"
          >
            Venue Outreach
          </Link>

          <Link
            href="/admin/venues"
            aria-current="page"
            className="rounded-full bg-[#173A2C] px-5 py-3 text-sm font-bold text-white"
          >
            Venue Enquiries
          </Link>
        </nav>
      </div>

      <Suspense
        fallback={
          <main className="mx-auto max-w-6xl px-5 py-10 text-[#173A2C] md:px-10">
            <p role="status" className="font-bold">
              Loading venue enquiries…
            </p>
          </main>
        }
      >
        <VenueEnquiries searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
