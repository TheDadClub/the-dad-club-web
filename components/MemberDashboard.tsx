import Link from "next/link";
import { requireMember } from "../lib/members";
import {
  displaySessionDate,
  sessionTypes,
} from "../lib/programSessions";
import { memberSignOut } from "../app/members/actions";
import { bookMemberSession } from "../app/members/booking-actions";
import { changeMemberWaitlist } from "../app/members/waitlist-actions";
import MemberBookButton from "./MemberBookButton";
import MemberWaitlistButton from "./MemberWaitlistButton";

export type MemberSearchParams = Promise<{
  booking?: string | string[];
  email?: string | string[];
  error?: string | string[];
  waitlist?: string | string[];
  waitlistError?: string | string[];
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

type WaitlistEntry = {
  id: string;
  session_id: string;
  joined_at: string;
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
  full: "That session has just filled up. You can join its waitlist below.",
  unknown:
    "We couldn't confirm the booking result. Check your bookings below before trying again. Contact us if you're unsure.",
};

const waitlistErrors: Record<string, string> = {
  invalid: "Please choose a waitlist option from this page.",
  session: "That session is no longer available to join.",
  entitlement: "Your matching session entitlement is not available.",
  duplicate: "You already have a booking for this session type.",
  space: "A place has opened up. You can book this session below.",
  access: "An active membership is required. Please contact us.",
  unknown:
    "We couldn't confirm the waitlist change. Check the current status below before trying again.",
};

function scalar(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

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

function WaitlistForm({
  sessionId,
  leaving = false,
}: {
  sessionId: string;
  leaving?: boolean;
}) {
  return (
    <form action={changeMemberWaitlist}>
      <input type="hidden" name="session_id" value={sessionId} />
      <input
        type="hidden"
        name="intent"
        value={leaving ? "leave" : "join"}
      />
      <MemberWaitlistButton leaving={leaving} />
    </form>
  );
}

export default async function MemberDashboard({
  searchParams,
}: {
  searchParams: MemberSearchParams;
}) {
  const { member, database } = await requireMember();
  const params = await searchParams;
  const now = new Date().toISOString();

  const [
    entitlementResult,
    bookingResult,
    sessionResult,
    waitlistResult,
  ] = await Promise.all([
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
      .gt("starts_at", now)
      .order("starts_at")
      .order("id")
      .limit(50),

    database
      .from("session_waitlist")
      .select("id, session_id, joined_at")
      .eq("member_id", member.id)
      .eq("status", "waiting")
      .order("joined_at")
      .order("id")
      .limit(100),
  ]);

  if (
    entitlementResult.error ||
    bookingResult.error ||
    sessionResult.error ||
    waitlistResult.error
  ) {
    throw new Error(
      "Unable to load your membership. Please refresh and try again.",
    );
  }

  const entitlements =
    (entitlementResult.data ?? []) as Entitlement[];

  const bookings = (bookingResult.data ?? []) as Booking[];
  const upcomingSessions = (sessionResult.data ?? []) as Session[];
  const waitlist = (waitlistResult.data ?? []) as WaitlistEntry[];

  const sessionMap = new Map(
    upcomingSessions.map((session) => [session.id, session]),
  );

  const waitingSessionIds = new Set(
    waitlist.map((entry) => entry.session_id),
  );

  const missingSessionIds = [
    ...new Set([
      ...bookings.map((booking) => booking.session_id),
      ...waitlist.map((entry) => entry.session_id),
    ]),
  ].filter((id) => !sessionMap.has(id));

  if (missingSessionIds.length > 0) {
    const { data, error } = await database
      .from("program_sessions")
      .select(sessionFields)
      .in("id", missingSessionIds);

    if (error) {
      throw new Error("Unable to load your session details.");
    }

    for (const session of (data ?? []) as Session[]) {
      sessionMap.set(session.id, session);
    }
  }

  // Include future published dates already waitlisted by this
  // member, even when outside the next 50 general dates.
  const selectableSessions = [...sessionMap.values()]
    .filter(
      (session) =>
        session.status === "published" &&
        Date.parse(session.starts_at) > Date.parse(now),
    )
    .sort(
      (first, second) =>
        Date.parse(first.starts_at) - Date.parse(second.starts_at),
    );

  // Only aggregate counts are requested; other members' details
  // are never loaded into this member page.
  const capacityResults = await Promise.all(
    selectableSessions.map(async (session) => {
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

  const confirmedBooking = bookings.find(
    (booking) => booking.id === scalar(params.booking),
  );

  const errorMessage = errorMessages[scalar(params.error)];
  const waitlistError =
    waitlistErrors[scalar(params.waitlistError)];

  const inactiveWaitlist = waitlist.filter((entry) => {
    const session = sessionMap.get(entry.session_id);

    return (
      !session ||
      session.status !== "published" ||
      Date.parse(session.starts_at) <= Date.parse(now)
    );
  });

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

          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-[#52645A]">
            An available entitlement means you can book that session
            type. Each date has its own capacity. Joining a waitlist
            does not reserve a place or use your entitlement.
            Automatic waitlist emails are not available yet; check
            back for openings or contact us.
          </p>

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

          {params.waitlist === "joined" && (
            <p
              role="status"
              className="mt-6 rounded-2xl bg-[#E8EBDD] p-5 text-sm leading-relaxed"
            >
              Waitlist request saved. Your current status is shown
              below. A waitlist entry does not guarantee a place.
            </p>
          )}

          {params.waitlist === "left" && (
            <p
              role="status"
              className="mt-6 rounded-2xl bg-[#E8EBDD] p-5 text-sm"
            >
              Waitlist change saved. Your current entries are shown below.
            </p>
          )}

          {(errorMessage || waitlistError) && (
            <p
              role="alert"
              className="mt-6 rounded-2xl bg-[#C96632]/10 p-5 text-sm leading-relaxed"
            >
              {errorMessage || waitlistError}
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
                entitlement?.status === "available" && !booking;

              const dates = selectableSessions.filter(
                (session) => session.session_number === type.number,
              );

              const label = used
                ? "Used"
                : booked
                  ? "Booked"
                  : canChoose
                    ? "Entitlement available"
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

                        const waiting =
                          waitingSessionIds.has(session.id);

                        return (
                          <div
                            key={session.id}
                            className="rounded-2xl border border-[#173A2C]/15 bg-white/60 p-5"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <p className="text-sm font-bold">
                                {places > 0
                                  ? `${places} ${
                                      places === 1 ? "place" : "places"
                                    } available`
                                  : "Currently full"}
                              </p>

                              {waiting && (
                                <span className="rounded-full bg-[#C96632]/15 px-4 py-2 text-xs font-bold">
                                  Waitlisted
                                </span>
                              )}
                            </div>

                            <SessionDetails session={session} />

                            {waiting && places > 0 && (
                              <p className="mt-4 text-sm leading-relaxed text-[#52645A]">
                                A place is currently available.
                                You can book it below. Your waitlist
                                entry does not hold the place.
                              </p>
                            )}

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

                            <div className="mt-5">
                              {waiting ? (
                                <WaitlistForm
                                  sessionId={session.id}
                                  leaving
                                />
                              ) : places === 0 ? (
                                <WaitlistForm sessionId={session.id} />
                              ) : null}
                            </div>
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

          {inactiveWaitlist.length > 0 && (
            <section className="mt-8 rounded-[24px] border border-[#173A2C]/15 p-6">
              <h3 className="text-xl font-black">
                Other waitlist entries
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-[#52645A]">
                These dates have started or are no longer published.
                You can remove your waitlist entries below.
              </p>

              <div className="mt-5 space-y-5">
                {inactiveWaitlist.map((entry) => {
                  const session = sessionMap.get(entry.session_id);

                  return (
                    <div
                      key={entry.id}
                      className="rounded-2xl bg-[#E8EBDD] p-5"
                    >
                      {session ? (
                        <SessionDetails session={session} />
                      ) : (
                        <p className="text-sm">
                          Session details unavailable.
                        </p>
                      )}

                      <div className="mt-4">
                        <WaitlistForm
                          sessionId={entry.session_id}
                          leaving
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <p className="mt-6 text-sm leading-relaxed text-[#52645A]">
            Showing the next 50 published dates, plus relevant
            existing bookings and up to 100 waiting entries.
            Places are checked again when you book. Booking uses
            your existing entitlement; this page does not collect
            payment.
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