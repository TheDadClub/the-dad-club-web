import Link from "next/link";
import { requireAdmin } from "../lib/admin";
import {
  displaySessionDate,
  sessionTitle,
} from "../lib/programSessions";

export type BookingChangeSearchParams = {
  changePage?: string | string[];
};

type SessionSnapshot = {
  session_id: string;
  starts_at: string;
  ends_at: string;
  venue_name: string | null;
  venue_address: string | null;
};

type BookingChange = {
  id: string;
  member_id: string;
  old_booking_id: string;
  new_booking_id: string;
  session_number: number;
  recipient_email: string;
  old_session_details: SessionSnapshot;
  new_session_details: SessionSnapshot;
  created_at: string;
  email_status: string;
  email_accepted_at: string | null;
};

type Member = {
  id: string;
  name: string;
};

const pageSize = 20;

const emailLabels: Record<string, string> = {
  pending: "Outcome pending",
  accepted: "Accepted for sending",
  not_confirmed: "Sending outcome not confirmed",
  skipped: "Skipped",
};

const emailDescriptions: Record<string, string> = {
  pending:
    "No final sending outcome has been recorded. The request may still be processing or may have been interrupted.",
  accepted:
    "Resend accepted the Booking Changed email. This does not confirm inbox delivery.",
  not_confirmed:
    "Acceptance could not be confirmed. A timed-out request may still have succeeded. Check Resend before considering another send.",
  skipped:
    "The email was skipped because the replacement booking, member or session was no longer eligible when checked.",
};

function historyUrl(page: number) {
  const query = new URLSearchParams({ view: "changes" });

  if (page > 1) {
    query.set("changePage", String(page));
  }

  return `/admin/bookings?${query.toString()}#booking-changes`;
}

function displayDate(value: string) {
  if (!Number.isFinite(Date.parse(value))) {
    return "Date unavailable";
  }

  return displaySessionDate(value);
}

function SnapshotDetails({
  title,
  snapshot,
}: {
  title: string;
  snapshot: SessionSnapshot;
}) {
  return (
    <section className="min-w-0 rounded-2xl bg-[#E8EBDD] p-5">
      <h3 className="font-black">{title}</h3>

      <dl className="mt-4 space-y-3 text-sm">
        <div>
          <dt className="font-bold">Starts</dt>
          <dd className="mt-1 text-[#52645A]">
            {displayDate(snapshot.starts_at)}
          </dd>
        </div>

        <div>
          <dt className="font-bold">Ends</dt>
          <dd className="mt-1 text-[#52645A]">
            {displayDate(snapshot.ends_at)}
          </dd>
        </div>

        <div>
          <dt className="font-bold">Venue / delivery</dt>
          <dd className="mt-1 whitespace-pre-wrap break-words text-[#52645A]">
            {snapshot.venue_name || "Not recorded"}

            {snapshot.venue_address && (
              <>
                <br />
                {snapshot.venue_address}
              </>
            )}
          </dd>
        </div>
      </dl>
    </section>
  );
}

export default async function BookingChangeHistory({
  searchParams,
}: {
  searchParams: Promise<BookingChangeSearchParams>;
}) {
  const { database } = await requireAdmin();
  const params = await searchParams;

  const rawPage =
    typeof params.changePage === "string"
      ? params.changePage
      : "1";

  const requestedPage = Number(rawPage);

  const page =
    /^\d+$/.test(rawPage) &&
    Number.isSafeInteger(requestedPage) &&
    requestedPage >= 1 &&
    requestedPage <= 100000
      ? requestedPage
      : 1;

  const offset = (page - 1) * pageSize;

  let changes: BookingChange[] = [];
  let total = 0;
  let failed = false;

  try {
    const { data, count, error } = await database
      .from("booking_changes")
      .select(
        "id, member_id, old_booking_id, new_booking_id, session_number, recipient_email, old_session_details, new_session_details, created_at, email_status, email_accepted_at",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) {
      console.error(
        "Booking change history could not be loaded:",
        error.code,
      );
      failed = true;
    } else {
      changes = (data ?? []) as BookingChange[];
      total = count ?? 0;
    }
  } catch {
    console.error("Booking change history request failed.");
    failed = true;
  }

  const memberLookup = new Map<string, Member>();
  let memberDetailsAvailable = true;

  if (!failed && changes.length > 0) {
    try {
      const memberIds = [
        ...new Set(changes.map((change) => change.member_id)),
      ];

      const { data, error } = await database
        .from("members")
        .select("id, name")
        .in("id", memberIds);

      if (error) {
        console.error(
          "Booking change member details unavailable:",
          error.code,
        );
        memberDetailsAvailable = false;
      } else {
        for (const member of (data ?? []) as Member[]) {
          memberLookup.set(member.id, member);
        }
      }
    } catch {
      console.error("Booking change member lookup failed.");
      memberDetailsAvailable = false;
    }
  }

  const hasNext = offset + pageSize < total;

  return (
    <main
      id="booking-changes"
      className="mx-auto max-w-6xl scroll-mt-6 px-5 py-10 text-[#173A2C] md:px-10"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Booking changes
          </h1>

          <p className="mt-4 max-w-3xl leading-relaxed text-[#52645A]">
            Member-requested moves between session dates, newest
            first. Each record links the released booking to its
            replacement and tracks the Booking Changed email.
          </p>
        </div>

        <Link
          href={historyUrl(page)}
          prefetch={false}
          className="rounded-full border border-[#173A2C]/25 px-5 py-3 text-sm font-bold hover:bg-[#E8EBDD]"
        >
          Refresh history
        </Link>
      </div>

      <p className="mt-5 rounded-2xl bg-[#E8EBDD] p-5 text-sm leading-relaxed">
        Dates and venue details below are snapshots saved when
        the booking changed. They are historical records, not
        confirmation that a replacement is still booked or that
        session details have remained unchanged. Times use
        Australian Central time, including daylight saving.
      </p>

      {failed ? (
        <p
          role="alert"
          className="mt-6 rounded-2xl bg-[#C96632]/10 p-5 text-sm"
        >
          We couldn&apos;t load booking change history.
          Please refresh and try again.
        </p>
      ) : (
        <>
          <p className="mt-6 text-sm font-bold">
            {total} recorded {total === 1 ? "change" : "changes"}
          </p>

          {!memberDetailsAvailable && (
            <p
              role="alert"
              className="mt-5 rounded-2xl bg-[#C96632]/10 p-5 text-sm"
            >
              Member names could not be loaded. Change records
              and recorded recipient addresses are still shown.
            </p>
          )}

          {changes.length === 0 ? (
            <div className="mt-6 rounded-2xl bg-[#FBF8F0] p-6">
              <p className="font-bold">
                {page === 1
                  ? "No booking changes recorded yet."
                  : "No booking changes on this page."}
              </p>

              {page > 1 && (
                <Link
                  href={historyUrl(1)}
                  prefetch={false}
                  className="mt-4 inline-block text-sm font-bold underline underline-offset-4"
                >
                  Return to the first page
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-6 space-y-6">
              {changes.map((change) => {
                const member = memberLookup.get(change.member_id);

                return (
                  <article
                    key={change.id}
                    className="rounded-[24px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6 sm:p-8"
                  >
                    <h2 className="break-words text-xl font-black">
                      {member?.name ?? "Member name unavailable"}
                    </h2>

                    <p className="mt-2 text-sm font-bold">
                      {change.session_number}.{" "}
                      {sessionTitle(change.session_number)}
                    </p>

                    <p className="mt-2 text-sm text-[#52645A]">
                      Changed {displayDate(change.created_at)}
                    </p>

                    <div className="mt-6 grid gap-4 md:grid-cols-2">
                      <SnapshotDetails
                        title="Previous booking — released"
                        snapshot={change.old_session_details}
                      />

                      <SnapshotDetails
                        title="Replacement booking — created"
                        snapshot={change.new_session_details}
                      />
                    </div>

                    <section className="mt-6 border-t border-[#173A2C]/15 pt-5">
                      <h3 className="font-bold">
                        Booking Changed email
                      </h3>

                      <p className="mt-3 text-sm font-semibold">
                        {emailLabels[change.email_status] ??
                          "Unknown status"}
                      </p>

                      <p className="mt-2 break-all text-sm text-[#52645A]">
                        Recorded recipient: {change.recipient_email}
                      </p>

                      {change.email_accepted_at && (
                        <p className="mt-2 text-sm text-[#52645A]">
                          Accepted:{" "}
                          {displayDate(change.email_accepted_at)}
                        </p>
                      )}

                      <p className="mt-3 text-sm leading-relaxed text-[#52645A]">
                        {emailDescriptions[change.email_status] ??
                          "The sending outcome needs review."}
                      </p>

                      <p className="mt-2 text-xs leading-relaxed text-[#52645A]">
                        Refreshing this page does not send an email.
                        There is no automatic retry or resend
                        control for these messages.
                      </p>
                    </section>

                    <details className="mt-5">
                      <summary className="cursor-pointer py-2 text-sm font-bold underline underline-offset-4">
                        Booking references
                      </summary>

                      <dl className="mt-3 space-y-3 text-xs">
                        <div>
                          <dt className="font-bold">
                            Change reference
                          </dt>
                          <dd className="mt-1 break-all text-[#52645A]">
                            {change.id}
                          </dd>
                        </div>

                        <div>
                          <dt className="font-bold">
                            Previous booking
                          </dt>
                          <dd className="mt-1 break-all text-[#52645A]">
                            {change.old_booking_id}
                          </dd>
                        </div>

                        <div>
                          <dt className="font-bold">
                            Replacement booking
                          </dt>
                          <dd className="mt-1 break-all text-[#52645A]">
                            {change.new_booking_id}
                          </dd>
                        </div>
                      </dl>
                    </details>

                    <Link
                      href={`/admin/members?edit=${change.member_id}#member-form`}
                      prefetch={false}
                      className="mt-5 inline-flex min-h-11 items-center text-sm font-bold underline underline-offset-4"
                    >
                      View member
                    </Link>
                  </article>
                );
              })}
            </div>
          )}

          {(page > 1 || hasNext) && (
            <nav
              aria-label="Booking change history pages"
              className="mt-8 flex flex-wrap items-center justify-between gap-4 text-sm font-bold"
            >
              {page > 1 ? (
                <Link
                  href={historyUrl(page - 1)}
                  prefetch={false}
                  className="rounded-full border border-[#173A2C]/25 px-5 py-3 hover:bg-[#E8EBDD]"
                >
                  ← Previous
                </Link>
              ) : (
                <span />
              )}

              <span>Page {page}</span>

              {hasNext ? (
                <Link
                  href={historyUrl(page + 1)}
                  prefetch={false}
                  className="rounded-full border border-[#173A2C]/25 px-5 py-3 hover:bg-[#E8EBDD]"
                >
                  Next →
                </Link>
              ) : (
                <span />
              )}
            </nav>
          )}
        </>
      )}
    </main>
  );
}