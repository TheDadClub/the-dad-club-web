import Link from "next/link";
import { requireMember } from "../lib/members";
import {
  displaySessionDate,
  sessionTypes,
} from "../lib/programSessions";
import { memberSignOut } from "../app/members/actions";
import { bookMemberSession } from "../app/members/booking-actions";
import MemberBookButton from "./MemberBookButton";

export type MemberSearchParams = Promise<{
  booking?: string | string[];
  email?: string | string[];
  error?: string | string[];
}>;

type Entitlement = {
  session_number: number;
  status: string;
};

type Booking = {
  id: string;
  session_id: string;
  session_number: number;
  status: string;
};

type Session = {
  id: string;
  session_number: number;
  starts_at: string;
  ends_at: string;
  venue_name: string;
  venue_address: string;
  capacity: number;
  status: string;
};

const sessionFields =
  "id, session_number, starts_at, ends_at, venue_name, venue_address, capacity, status";

const errorMessages: Record<string, string> = {
  invalid: "Please choose a session from the dates below.",
  access: "Your membership could not be used for this booking. Please contact us.",
  session: "That session is no longer available. Please choose another date.",
  started: "That session has already started. Please choose a future date.",
  entitlement: "This session entitlement is not available. Check your bookings below or contact us.",
  duplicate: "You already have a booking or attendance recorded for this session type. Check below.",
  full: "That session has just filled up. Please choose another date.",
  unknown:
    "We couldn't confirm the booking result. Check your bookings below before trying again. Contact us if you're unsure.",
};

function SessionDetails({ session }: { session: Session }) {
  return (
    <dl className="mt-4 space-y-3 text-sm">
      <div>
        <dt className="font-bold">Starts</dt>
        <dd className="mt-1 text-[#52645A]">
          {displaySessionDate(session.starts_at)}
        </dd>
      </div>

      <div>
        <dt className="font-bold">Ends</dt>
        <dd className="mt-1 text-[#52645A]">
          {displaySessionDate(session.ends_at)}
        </dd>
      </div>

      <div>
        <dt className="font-bold">Venue / delivery</dt>
        <dd className="mt-1 whitespace-pre-wrap break-words text-[#52645A]">
          {session.venue_name}
          {session.venue_address && (
            <>
              <br />
              {session.venue_address}
            </>
          )}
        </dd>
      </div>
    </dl>
  );
}

export default async function MemberDashboard({
  searchParams,
}: {
  searchParams: MemberSearchParams;
}) {
  const { member, database } = await requireMember();
  const params = await searchParams;

  const [entitlementResult, bookingResult, sessionResult] =
    await Promise.all([
      database
        .from("member_entitlements")
        .select("session_number, status")
        .eq("member_id", member.id)
        .order("session_number"),

      database
        .from("session_bookings")
        .select("id, session_id, session_number, status")
        .eq("member_id", member.id)
        .in("status", ["booked", "attended"]),

      database
        .from("program_sessions")
        .select(sessionFields)
        .eq("status", "published")
        .gt("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(50),
    ]);

  if (
    entitlementResult.error ||
    bookingResult.error ||
    sessionResult.error
  ) {
    throw new Error(
      "Unable to load your membership. Please refresh and try again.",
    );
  }

  const entitlements =
    (entitlementResult.data ?? []) as Entitlement[];

  const bookings = (bookingResult.data ?? []) as Booking[];
  const upcomingSessions = (sessionResult.data ?? []) as Session[];

  const sessionMap = new Map(
    upcomingSessions.map((session) => [session.id, session]),
  );

  const missingSessionIds = [
    ...new Set(
      bookings
        .map((booking) => booking.session_id)
        .filter((id) => !sessionMap.has(id)),
    ),
  ];

  if (missingSessionIds.length > 0) {
    const { data, error } = await database
      .from("program_sessions")
      .select(sessionFields)
      .in("id", missingSessionIds);

    if (error) {
      throw new Error("Unable to load your booked session details.");
    }

    for (const session of (data ?? []) as Session[]) {
      sessionMap.set(session.id, session);
    }
  }

  // Count places on the server. Other members' booking details
  // are never loaded into the page.
  const capacityResults = await Promise.all(
    upcomingSessions.map(async (session) => {
      const { count, error } = await database
        .from("session_bookings")
        .select("id", { count: "exact", head: true })
        .eq("session_id", session.id)
        .in("status", ["booked", "attended"]);

      if (error || count === null) {
        throw new Error("Unable to check session availability.");
      }

      return [
        session.id,
        Math.max(0, session.capacity - count),
      ] as const;
    }),
  );

  const placesBySession = new Map(capacityResults);

  const confirmedBooking =
    typeof params.booking === "string"
      ? bookings.find((booking) => booking.id === params.booking)
      : undefined;

  const errorCode =
    typeof params.error === "string" ? params.error : "";

  const errorMessage = errorMessages[errorCode];

  return (
    <>
      <header className="bg-[#173A2C] text-[#F4F0E5]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-5 px-5 py-6 md:px-10">
          <Link href="/" className="text-lg font-black">
            THE DAD CLUB →
          </Link>

          <div className="flex flex-wrap items-center gap-5 text-sm font-bold">
            <Link href="/app">The app</Link>

            <form action={memberSignOut}>
              <button
                type="submit"
                className="rounded-full border border-[#F4F0E5]/40 px-5 py-3 hover:bg-white/10"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-12 md:px-10 md:py-20">
        <p className="text-xs font-extrabold tracking-[0.2em] text-[#C96632]">
          YOUR DAD CLUB
        </p>

        <h1 className="mt-5 break-words text-4xl font-black tracking-tight sm:text-5xl">
          Welcome, {member.name}.
        </h1>

        <p className="mt-6 max-w-2xl leading-relaxed text-[#52645A]">
          Five moments to connect, reflect and find your feet.
          Choose the available dates that work for you.
        </p>

        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#52645A]">
          All session times below use Adelaide time, including
          daylight saving. For online sessions, check the time
          difference if you are joining from another state.
        </p>

        <section id="sessions" className="mt-10 scroll-mt-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-black">Your sessions</h2>

            <Link
              href="/members"
              prefetch={false}
              className="rounded-full border border-[#173A2C]/25 px-5 py-3 text-sm font-bold"
            >
              Refresh availability
            </Link>
          </div>

          {confirmedBooking && (
            <div
              role="status"
              className="mt-6 rounded-2xl bg-[#E8EBDD] p-5 leading-relaxed"
            >
              <p className="font-bold">
                Your booking is saved and listed below.
              </p>
              <p className="mt-2 text-sm">
                {params.email === "accepted"
                  ? "Your confirmation email has been accepted for sending. It may take a few minutes to arrive."
                  : "Email confirmation wasn't confirmed. Your booking remains saved; contact us if you need a copy."}
              </p>
            </div>
          )}

          {errorMessage && (
            <p
              role="alert"
              className="mt-6 rounded-2xl bg-[#C96632]/10 p-5 text-sm leading-relaxed"
            >
              {errorMessage}
            </p>
          )}

          <div className="mt-7 space-y-6">
            {sessionTypes.map((type) => {
              const entitlement = entitlements.find(
                (item) => item.session_number === type.number,
              );

              const booking = bookings.find(
                (item) => item.session_number === type.number,
              );

              const bookedSession = booking
                ? sessionMap.get(booking.session_id)
                : undefined;

              const used =
                entitlement?.status === "used" ||
                booking?.status === "attended";

              const booked = booking?.status === "booked";

              const canChoose =
                entitlement?.status === "available" &&
                !booking;

              const dates = upcomingSessions.filter(
                (session) => session.session_number === type.number,
              );

              const label = used
                ? "Used"
                : booked
                  ? "Booked"
                  : canChoose
                    ? "Available"
                    : "Unavailable";

              return (
                <article
                  key={type.number}
                  className="rounded-[28px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6 sm:p-8"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-extrabold tracking-wide text-[#C96632]">
                        SESSION {String(type.number).padStart(2, "0")}
                      </p>
                      <h3 className="mt-3 text-2xl font-black">
                        {type.title}
                      </h3>
                      <p className="mt-2 text-sm text-[#52645A]">
                        {type.timing}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-xs font-bold ${
                        booked || used
                          ? "bg-[#173A2C] text-[#F4F0E5]"
                          : "bg-[#E8EBDD] text-[#173A2C]"
                      }`}
                    >
                      {label}
                    </span>
                  </div>

                  {bookedSession && (
                    <div className="mt-6 rounded-2xl bg-[#E8EBDD] p-5">
                      <p className="font-bold">
                        {used ? "Session attended" : "Your booking"}
                      </p>

                      <SessionDetails session={bookedSession} />

                      {booked && bookedSession.status !== "published" && (
                        <p className="mt-4 text-sm font-bold text-[#9B3D24]">
                          This session&apos;s status has changed.
                          Please contact us before attending.
                        </p>
                      )}

                      {booked && (
                        <p className="mt-4 text-sm leading-relaxed text-[#52645A]">
                          Need to change your booking?{" "}
                          <a
                            href="mailto:hello@thedadclub.com.au"
                            className="font-bold underline underline-offset-4"
                          >
                            Contact us
                          </a>
                          .
                        </p>
                      )}
                    </div>
                  )}

                  {used && !bookedSession && (
                    <p className="mt-5 text-sm text-[#52645A]">
                      This session entitlement has been used.
                    </p>
                  )}

                  {canChoose && (
                    <div className="mt-6 space-y-4">
                      {dates.length === 0 && (
                        <p className="rounded-2xl bg-[#E8EBDD] p-5 text-sm leading-relaxed text-[#52645A]">
                          No upcoming dates are listed for this
                          session yet. Your entitlement remains
                          available.
                        </p>
                      )}

                      {dates.map((session) => {
                        const places =
                          placesBySession.get(session.id) ?? 0;

                        return (
                          <div
                            key={session.id}
                            className="rounded-2xl border border-[#173A2C]/15 bg-white/60 p-5"
                          >
                            <p className="text-sm font-bold">
                              {places > 0
                                ? `${places} ${
                                    places === 1 ? "place" : "places"
                                  } available`
                                : "Currently full"}
                            </p>

                            <SessionDetails session={session} />

                            {places > 0 && (
                              <form action={bookMemberSession}>
                                <input
                                  type="hidden"
                                  name="session_id"
                                  value={session.id}
                                />
                                <MemberBookButton />
                              </form>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {!used && !booked && !canChoose && (
                    <p className="mt-5 text-sm leading-relaxed text-[#52645A]">
                      This entitlement is not currently available.
                      Please contact us if you need help.
                    </p>
                  )}
                </article>
              );
            })}
          </div>

          <p className="mt-6 text-sm leading-relaxed text-[#52645A]">
            Showing up to 50 upcoming published dates. Places are
            checked again when you book. Booking uses your existing
            session entitlement; this page does not collect payment.
          </p>
        </section>

        <footer className="mt-12 border-t border-[#173A2C]/15 pt-6 text-sm text-[#52645A]">
          <p>
            Need a hand?{" "}
            <a
              href="mailto:hello@thedadclub.com.au"
              className="font-bold underline underline-offset-4"
            >
              Contact The Dad Club
            </a>
          </p>

          <Link
            href="/privacy/website"
            className="mt-4 inline-block underline underline-offset-4"
          >
            Website privacy notice
          </Link>
        </footer>
      </main>
    </>
  );
}