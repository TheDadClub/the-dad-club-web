import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import BookingManager, {
  type BookingSearchParams,
} from "../../../components/BookingManager";
import AdminWaitlist, {
  type WaitlistSearchParams,
} from "../../../components/AdminWaitlist";
import { requireAdmin } from "../../../lib/admin";

export const metadata: Metadata = {
  title: "Bookings | The Dad Club Admin",
  robots: {
    index: false,
    follow: false,
  },
};

type SearchParams = Promise<
  BookingSearchParams &
    WaitlistSearchParams & {
      view?: string | string[];
    }
>;

async function BookingsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();

  const params = await searchParams;
  const showingWaitlist = params.view === "waitlist";

  return (
    <div className="min-h-screen bg-[#F4F0E5] text-[#173A2C]">
      <nav
        aria-label="Booking views"
        className="border-b border-[#173A2C]/10"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap gap-3 px-5 py-4 md:px-10">
          <Link
            href="/admin/bookings"
            prefetch={false}
            aria-current={!showingWaitlist ? "page" : undefined}
            className={`rounded-full px-5 py-3 text-sm font-bold transition ${
              !showingWaitlist
                ? "bg-[#173A2C] text-[#F4F0E5]"
                : "border border-[#173A2C]/25 hover:bg-[#E8EBDD]"
            }`}
          >
            Bookings
          </Link>

          <Link
            href="/admin/bookings?view=waitlist"
            prefetch={false}
            aria-current={showingWaitlist ? "page" : undefined}
            className={`rounded-full px-5 py-3 text-sm font-bold transition ${
              showingWaitlist
                ? "bg-[#173A2C] text-[#F4F0E5]"
                : "border border-[#173A2C]/25 hover:bg-[#E8EBDD]"
            }`}
          >
            Waitlists
          </Link>
        </div>
      </nav>

      {showingWaitlist ? (
        <AdminWaitlist searchParams={searchParams} />
      ) : (
        <BookingManager searchParams={searchParams} />
      )}
    </div>
  );
}

export default function BookingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F4F0E5] px-5 py-10 text-[#173A2C] md:px-10">
          <p className="mx-auto max-w-6xl font-bold">
            Loading bookings…
          </p>
        </main>
      }
    >
      <BookingsContent searchParams={searchParams} />
    </Suspense>
  );
}