import { Suspense } from "react";
import type { Metadata } from "next";
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