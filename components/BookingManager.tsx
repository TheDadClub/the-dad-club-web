import Link from "next/link";
import { requireAdmin } from "../lib/admin";
import {
  createBooking,
  updateBooking,
} from "../app/admin/bookings/actions";
import {
  displaySessionDate,
  sessionTitle,
} from "../lib/programSessions";
import BookingEmailStatus from "./BookingEmailStatus";

export type BookingSearchParams = {
  page?: string | string[];
  error?: string | string[];
  saved?: string | string[];
  email?: string | string[];
};

type Member = {
  id: string;
  name: string;
  email: string;
};

type Session = {
  id: string;
  session_number: number;
  starts_at: string;
  ends_at: string;
  venue_name: string;
  capacity: number;
  status: string;
};

type Booking = {
  id: string;
  member_id: string;
  session_id: string;
  session_number: number;
  status: "booked" | "attended" | "cancelled";
  created_at: string;
  attended_at: string | null;
  cancelled_at: string | null;
};

type ConfirmationEmail = {
  booking_id: string;
  status: string;
  accepted_at: string | null;
};

const pageSize = 25;

const sessionFields =
  "id,session_number,starts_at,ends_at,venue_name,capacity,status";

const inputClass =
  "mt-2 w-full min-w-0 rounded-xl border border-[#173A2C]/20 bg-[#FBF8F0] px-4 py-3 text-base focus:border-[#C96632] focus:outline-none focus:ring-2 focus:ring-[#C96632]/25";

const errorMessages: Record<string, string> = {
  invalid: "Choose a member and session, or refresh the booking list.",
  member: "Only active members can be booked.",
  session: "The session must be published.",
  started: "This session has already started. Choose a future date.",
  entitlement:
    "The matching entitlement is missing, used or revoked. Review the member record.",
  duplicate:
    "This member already has a live booking or recorded attendance for that session type.",
  full: "This session is full. Choose another session.",
  early: "Attendance can be recorded once the session starts.",
  changed:
    "This booking has already changed. Review its current status below.",
  save: "The booking change could not be saved. Please try again.",
};

const successMessages: Record<string, string> = {
  created: "Booking created.",
  cancelled: "Booking cancelled. The place has been released.",
  attended: "Attendance recorded. The matching entitlement is now used.",
};

const emailMessages: Record<string, string> = {
  accepted:
    "Resend accepted the booking confirmation email. This does not confirm inbox delivery.",
  not_confirmed:
    "The booking is saved, but email acceptance could not be confirmed. Check Resend before considering another send.",
  skipped:
    "The booking was saved, but the confirmation was not sent because the booking, member or session was no longer eligible when checked.",
};

const statusLabels = {
  booked: "Booked",
  attended: "Attended",
  cancelled: "Cancelled",
};

const statusClasses = {
  booked: "bg-[#173A2C] text-[#F4F0E5]",
  attended: "bg-[#E8EBDD] text-[#173A2C]",
  cancelled: "bg-[#C96632]/15 text-[#8D3E21]",
};

function scalar(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

export default async function BookingManager({
  searchParams,
}: {
  searchParams: Promise<BookingSearchParams>;
}) {
  // Authorise before loading member, booking or email information.
  const { database } = await requireAdmin();
  const params = await searchParams;

  const requestedPage = Number(scalar(params.page));
  const page =
    Number.isSafeInteger(requestedPage) &&
    requestedPage > 0 &&
    requestedPage <= 100000
      ? requestedPage
      : 1;

  const offset = (page - 1) * pageSize;
  const now = new Date().toISOString();

  const [membersResult, sessionsResult, bookingsResult] =
    await Promise.all([
      database
        .from("members")
        .select("id,name,email", { count: "exact" })
        .eq("status", "active")
        .order("name")
        .order("id")
        .limit(200),

      database
        .from("program_sessions")
        .select(sessionFields, { count: "exact" })
        .eq("status", "published")
        .gt("starts_at", now)
        .order("starts_at")
        .order("id")
        .limit(100),

      database
        .from("session_bookings")
        .select(
          "id,member_id,session_id,session_number,status,created_at,attended_at,cancelled_at",
          { count: "exact" },
        )
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(offset, offset + pageSize - 1),
    ]);

  if (
    membersResult.error ||
    sessionsResult.error ||
    bookingsResult.error
  ) {
    throw new Error("Unable to load booking management.");
  }

  const members = (membersResult.data ?? []) as Member[];
  const sessions = (sessionsResult.data ?? []) as Session[];
  const bookings = (bookingsResult.data ?? []) as Booking[];

  const memberLookup = new Map(
    members.map((member) => [member.id, member]),
  );

  const sessionLookup = new Map(
    sessions.map((session) => [session.id, session]),
  );

  const emailLookup = new Map<string, ConfirmationEmail>();
  let emailTrackingAvailable = true;

  if (bookings.length > 0) {
    try {
      const { data, error } = await database
        .from("booking_confirmation_emails")
        .select("booking_id,status,accepted_at")
        .in(
          "booking_id",
          bookings.map((booking) => booking.id),
        );

      if (error) {
        emailTrackingAvailable = false;
        console.error(
          "Booking email tracking could not be loaded:",
          error.code,
        );
      } else {
        for (const email of (data ?? []) as ConfirmationEmail[]) {
          emailLookup.set(email.booking_id, email);
        }
      }
    } catch {
      emailTrackingAvailable = false;
      console.error("Booking email tracking request failed.");
    }
  }

  // Load older sessions and archived members referenced on this page.
  const missingMemberIds = [
    ...new Set(
      bookings
        .map((booking) => booking.member_id)
        .filter((id) => !memberLookup.has(id)),
    ),
  ];

  const missingSessionIds = [
    ...new Set(
      bookings
        .map((booking) => booking.session_id)
        .filter((id) => !sessionLookup.has(id)),
    ),
  ];

  if (missingMemberIds.length > 0) {
    const { data, error } = await database
      .from("members")
      .select("id,name,email")
      .in("id", missingMemberIds);

    if (error) {
      throw new Error("Unable to load booking member details.");
    }

    for (const member of (data ?? []) as Member[]) {
      memberLookup.set(member.id, member);
    }
  }

  if (missingSessionIds.length > 0) {
    const { data, error } = await database
      .from("program_sessions")
      .select(sessionFields)
      .in("id", missingSessionIds);

    if (error) {
      throw new Error("Unable to load booking session details.");
    }

    for (const session of (data ?? []) as Session[]) {
      sessionLookup.set(session.id, session);
    }
  }

  const total = bookingsResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const canBook = members.length > 0 && sessions.length > 0;

  const errorCode = scalar(params.error);
  const savedCode = scalar(params.saved);
  const emailCode = scalar(params.email);

  return (
    <div className="min-h-screen bg-[#F4F0E5] text-[#173A2C]">
      <main className="mx-auto max-w-6xl px-5 py-10 md:px-10">
        <h1 className="text-4xl font-black tracking-tight">
          Bookings
        </h1>

        <p className="mt-4 max-w-3xl leading-relaxed text-[#52645A]">
          Book members into sessions, manage cancellations and record
          attendance. Dates and times use Adelaide time.
        </p>

        <div className="mt-4 space-y-3 rounded-xl bg-[#E8EBDD] p-4 text-sm leading-relaxed">
          <p>
            A booking reserves a session entitlement. Attendance marks
            it used. Cancelling releases the place and allows the
            available entitlement to be booked again.
          </p>

          <p>
            <strong>Creating a booking now sends a confirmation email</strong>{" "}
            to the member&apos;s recorded email address. Check the
            member and session before saving.
          </p>

          <p>
            Cancellation and attendance changes do not send emails yet.
            No payments are taken here. Later changes to session details
            do not automatically send an updated confirmation.
          </p>
        </div>

        {successMessages[savedCode] && (
          <p role="status" className="mt-6 font-bold">
            {successMessages[savedCode]}
          </p>
        )}

        {savedCode === "created" && emailMessages[emailCode] && (
          <p
            role="status"
            className="mt-3 rounded-xl bg-[#E8EBDD] p-4 text-sm leading-relaxed"
          >
            {emailMessages[emailCode]}
          </p>
        )}

        {errorCode && (
          <p
            role="alert"
            className="mt-6 rounded-xl bg-[#C96632]/10 p-4 text-sm"
          >
            {errorMessages[errorCode] ??
              "The change could not be saved. Please try again."}
          </p>
        )}

        {!emailTrackingAvailable && (
          <p
            role="alert"
            className="mt-6 rounded-xl bg-[#C96632]/10 p-4 text-sm"
          >
            Booking confirmation email statuses could not be loaded.
            Check Resend before considering another send.
          </p>
        )}

        <section className="mt-8 rounded-[28px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6 sm:p-8">
          <h2 className="text-2xl font-black">Create booking</h2>

          {!canBook && (
            <p className="mt-4 text-sm leading-relaxed text-[#52645A]">
              You need an active member and a published session with
              a future start time before creating a booking. Use the
              Members and Sessions tabs to add them.
            </p>
          )}

          <form action={createBooking} className="mt-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="min-w-0 text-sm font-bold">
                Member
                <select
                  name="member_id"
                  required
                  defaultValue=""
                  disabled={!canBook}
                  className={inputClass}
                >
                  <option value="" disabled>
                    Choose a member
                  </option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.name} — {member.email}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-0 text-sm font-bold">
                Session
                <select
                  name="session_id"
                  required
                  defaultValue=""
                  disabled={!canBook}
                  className={inputClass}
                >
                  <option value="" disabled>
                    Choose a session
                  </option>
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {session.session_number}.{" "}
                      {sessionTitle(session.session_number)} —{" "}
                      {displaySessionDate(session.starts_at)} —{" "}
                      {session.venue_name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="text-sm leading-relaxed text-[#52645A]">
              Capacity and entitlement availability are checked when
              you save. Full sessions may still appear in this list.
              A successful new booking triggers one confirmation-email
              attempt.
            </p>

            {(membersResult.count ?? 0) > 200 && (
              <p className="text-sm text-[#8D3E21]">
                This initial selector shows the first 200 active
                members alphabetically. Member search will be needed
                to book members beyond this list.
              </p>
            )}

            {(sessionsResult.count ?? 0) > 100 && (
              <p className="text-sm text-[#8D3E21]">
                Showing the next 100 published sessions.
              </p>
            )}

            <button
              type="submit"
              disabled={!canBook}
              className="rounded-full bg-[#173A2C] px-7 py-4 text-sm font-extrabold text-[#F4F0E5] transition hover:bg-[#245540] disabled:cursor-not-allowed disabled:opacity-40"
            >
              CREATE BOOKING & SEND CONFIRMATION →
            </button>
          </form>
        </section>

        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-black">
              Booking history ({total})
            </h2>

            <Link
              href={`/admin/bookings?page=${page}`}
              prefetch={false}
              className="rounded-full border border-[#173A2C]/25 px-5 py-3 text-sm font-bold"
            >
              Refresh list
            </Link>
          </div>

          <p className="mt-3 text-sm text-[#52645A]">
            Newest bookings first, including cancellations and attendance.
          </p>

          <div className="mt-6 space-y-4">
            {bookings.length === 0 && (
              <p className="rounded-2xl bg-[#E8EBDD] p-6">
                No bookings on this page.
              </p>
            )}

            {bookings.map((booking) => {
              const member = memberLookup.get(booking.member_id);
              const session = sessionLookup.get(booking.session_id);
              const email = emailLookup.get(booking.id);

              const attendanceOpen =
                session?.status === "published" &&
                Date.parse(session.starts_at) <= Date.parse(now);

              return (
                <article
                  key={booking.id}
                  className="rounded-[24px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="break-words text-xl font-black">
                        {member?.name ?? "Member unavailable"}
                      </h3>
                      <p className="mt-2 break-all text-sm text-[#52645A]">
                        {member?.email}
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-4 py-2 text-xs font-bold ${
                        statusClasses[booking.status]
                      }`}
                    >
                      {statusLabels[booking.status]}
                    </span>
                  </div>

                  <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="font-bold">Session</dt>
                      <dd className="mt-1 text-[#52645A]">
                        {booking.session_number}.{" "}
                        {sessionTitle(booking.session_number)}
                      </dd>
                    </div>

                    <div>
                      <dt className="font-bold">Starts</dt>
                      <dd className="mt-1 text-[#52645A]">
                        {session
                          ? displaySessionDate(session.starts_at)
                          : "Session unavailable"}
                      </dd>
                    </div>

                    <div>
                      <dt className="font-bold">Venue</dt>
                      <dd className="mt-1 break-words text-[#52645A]">
                        {session?.venue_name ?? "Unavailable"}
                      </dd>
                    </div>

                    <div>
                      <dt className="font-bold">Booking created</dt>
                      <dd className="mt-1 text-[#52645A]">
                        {displaySessionDate(booking.created_at)}
                      </dd>
                    </div>
                  </dl>

                  <BookingEmailStatus
                    status={
                      emailTrackingAvailable
                        ? email?.status ?? "not_recorded"
                        : "unavailable"
                    }
                    acceptedAt={email?.accepted_at ?? null}
                  />

                  {booking.status === "booked" && (
                    <div className="mt-6 border-t border-[#173A2C]/10 pt-5">
                      <div className="flex flex-wrap gap-3">
                        <form action={updateBooking}>
                          <input
                            type="hidden"
                            name="id"
                            value={booking.id}
                          />
                          <input
                            type="hidden"
                            name="status"
                            value="attended"
                          />
                          <button
                            type="submit"
                            disabled={!attendanceOpen}
                            className="rounded-full bg-[#173A2C] px-5 py-3 text-sm font-bold text-[#F4F0E5] hover:bg-[#245540] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Mark attended
                          </button>
                        </form>

                        <form action={updateBooking}>
                          <input
                            type="hidden"
                            name="id"
                            value={booking.id}
                          />
                          <input
                            type="hidden"
                            name="status"
                            value="cancelled"
                          />
                          <button
                            type="submit"
                            className="rounded-full border border-[#173A2C]/25 px-5 py-3 text-sm font-bold hover:bg-[#E8EBDD]"
                          >
                            Cancel booking
                          </button>
                        </form>
                      </div>

                      <p className="mt-3 text-xs leading-relaxed text-[#52645A]">
                        Attendance becomes available once the session
                        starts. Record it only after confirming the
                        member attended. Completed attendance cannot
                        be reversed from this screen.
                      </p>
                    </div>
                  )}

                  {booking.attended_at && (
                    <p className="mt-5 text-sm text-[#52645A]">
                      Attendance recorded:{" "}
                      {displaySessionDate(booking.attended_at)}
                    </p>
                  )}

                  {booking.cancelled_at && (
                    <p className="mt-5 text-sm text-[#52645A]">
                      Cancelled:{" "}
                      {displaySessionDate(booking.cancelled_at)}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-5 text-sm font-bold">
                    <Link
                      href={`/admin/members?edit=${booking.member_id}#member-form`}
                      prefetch={false}
                      className="underline underline-offset-4"
                    >
                      View member
                    </Link>
                    <Link
                      href={`/admin/sessions?edit=${booking.session_id}#session-form`}
                      prefetch={false}
                      className="underline underline-offset-4"
                    >
                      View session
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <nav
            aria-label="Booking pages"
            className="mt-7 flex flex-wrap items-center justify-between gap-4 text-sm font-semibold"
          >
            {page > 1 ? (
              <Link
                href={`/admin/bookings?page=${page - 1}`}
                prefetch={false}
                className="rounded-full border border-[#173A2C]/25 px-5 py-3"
              >
                ← Previous
              </Link>
            ) : (
              <span />
            )}

            <span>
              Page {page} of {totalPages}
            </span>

            {page < totalPages ? (
              <Link
                href={`/admin/bookings?page=${page + 1}`}
                prefetch={false}
                className="rounded-full border border-[#173A2C]/25 px-5 py-3"
              >
                Next →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </section>
      </main>
    </div>
  );
}