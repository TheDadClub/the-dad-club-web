import type { Metadata } from "next";
import { Suspense } from "react";
import BookingManager, {
  type BookingSearchParams,
} from "../../../components/BookingManager";

export const metadata: Metadata = {
  title: "Bookings | The Dad Club Admin",
  robots: {
    index: false,
    follow: false,
  },
};

export default function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<BookingSearchParams>;
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
      <BookingManager searchParams={searchParams} />
    </Suspense>
  );
}