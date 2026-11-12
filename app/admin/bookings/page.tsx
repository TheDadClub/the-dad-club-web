import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import BookingManager, {
  type BookingSearchParams,
} from "../../../components/BookingManager";
import AdminWaitlist, {
  type WaitlistSearchParams,
} from "../../../components/AdminWaitlist";
import BookingChangeHistory, {
  type BookingChangeSearchParams,
} from "../../../components/BookingChangeHistory";
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
    WaitlistSearchParams &
    BookingChangeSearchParams & {
      view?: string | string[];
    }
>;

const views = [
  {
    value: "bookings",
    label: "Bookings",
    href: "/admin/bookings",
  },
  {
    value: "waitlist",
    label: "Waitlists",
    href: "/admin/bookings?view=waitlist",
  },
  {
    value: "changes",
    label: "Booking changes",
    href: "/admin/bookings?view=changes",
  },
];

async function BookingsContent({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();

  const params = await searchParams;

  const view =
    params.view === "waitlist" || params.view === "changes"
      ? params.view
      : "bookings";

  return (
    <div className="min-h-screen bg-[#F4F0E5] text-[#173A2C]">
      <nav
        aria-label="Booking views"
        className="border-b border-[#173A2C]/10"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap gap-3 px-5 py-4 md:px-10">
          {views.map((item) => {
            const active = view === item.value;

            return (
              <Link
                key={item.value}
                href={item.href}
                prefetch={false}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-5 py-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632] ${
                  active
                    ? "bg-[#173A2C] text-[#F4F0E5]"
                    : "border border-[#173A2C]/25 hover:bg-[#E8EBDD]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {view === "waitlist" ? (
        <AdminWaitlist searchParams={searchParams} />
      ) : view === "changes" ? (
        <BookingChangeHistory searchParams={searchParams} />
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