import Link from "next/link";
import { requireAdmin } from "../lib/admin";
import {
  displaySessionDate,
  sessionTitle,
} from "../lib/programSessions";

export type WaitlistSearchParams = {
  waitlistPage?: string | string[];
  waitlistStatus?: string | string[];
};

type WaitlistEntry = {
  id: string;
  member_id: string;
  session_id: string;
  status: string;
  joined_at: string;
  updated_at: string;
};

type Member = {
  id: string;
  name: string;
  email: string;
  status: string;
};

type Session = {
  id: string;
  session_number: number;
  starts_at: string;
  venue_name: string;
  status: string;
};

const pageSize = 25;

const filters = [
  { value: "waiting", label: "Waiting" },
  { value: "left", label: "Left" },
  { value: "booked", label: "Booked" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All entries" },
];

const labels: Record<string, string> = {
  waiting: "Waiting",
  left: "Left waitlist",
  booked: "Booked",
  closed: "Closed — another date booked",
};

function scalar(value: string | string[] | undefined) {
  return typeof value === "string" ? value : "";
}

function listUrl(status: string, page = 1) {
  const query = new URLSearchParams({
    view: "waitlist",
    waitlistStatus: status,
  });

  if (page > 1) {
    query.set("waitlistPage", String(page));
  }

  return `/admin/bookings?${query.toString()}`;
}

export default async function AdminWaitlist({
  searchParams,
}: {
  searchParams: Promise<WaitlistSearchParams>;
}) {
  // Authorise before loading waitlist or member information.
  const { database } = await requireAdmin();
  const params = await searchParams;

  const requestedStatus = scalar(params.waitlistStatus);

  const status = filters.some(
    (filter) => filter.value === requestedStatus,
  )
    ? requestedStatus
    : "waiting";

  const requestedPage = Number(scalar(params.waitlistPage));

  const page =
    Number.isSafeInteger(requestedPage) &&
    requestedPage > 0 &&
    requestedPage <= 100_000
      ? requestedPage
      : 1;

  const offset = (page - 1) * pageSize;

  let query = database
    .from("session_waitlist")
    .select(
      "id, member_id, session_id, status, joined_at, updated_at",
      { count: "exact" },
    );

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query
    .order("joined_at", { ascending: true })
    .order("id", { ascending: true })
    .range(offset, offset + pageSize - 1);

  if (error) {
    throw new Error("Unable to load waitlists. Please try again.");
  }

  const entries = (data ?? []) as WaitlistEntry[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const members = new Map<string, Member>();
  const sessions = new Map<string, Session>();

  if (entries.length > 0) {
    const memberIds = [
      ...new Set(entries.map((entry) => entry.member_id)),
    ];

    const sessionIds = [
      ...new Set(entries.map((entry) => entry.session_id)),
    ];

    const [memberResult, sessionResult] = await Promise.all([
      database
        .from("members")
        .select("id, name, email, status")
        .in("id", memberIds),

      database
        .from("program_sessions")
        .select(
          "id, session_number, starts_at, venue_name, status",
        )
        .in("id", sessionIds),
    ]);

    if (memberResult.error || sessionResult.error) {
      throw new Error("Unable to load waitlist details.");
    }

    for (const member of (memberResult.data ?? []) as Member[]) {
      members.set(member.id, member);
    }

    for (const session of (sessionResult.data ?? []) as Session[]) {
      sessions.set(session.id, session);
    }
  }

  const now = Date.now();

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 text-[#173A2C] md:px-10">
      <h1 className="text-4xl font-black tracking-tight">
        Session waitlists
      </h1>

      <p className="mt-4 max-w-3xl leading-relaxed text-[#52645A]">
        See who has requested a place at a full session. Entries are
        shown by joining time, oldest first. Dates use Adelaide time.
      </p>

      <div className="mt-5 space-y-3 rounded-2xl bg-[#E8EBDD] p-5 text-sm leading-relaxed">
        <p>
          Waitlisting does not reserve a place or use an entitlement.
          Members can leave and rejoin; rejoining records a new
          joining time.
        </p>

        <p>
          Booking a session closes that member&apos;s waiting entries
          for the same session type. Cancelling that booking does
          not automatically rejoin those waitlists.
        </p>

        <p>
          This view does not send emails, offer places or create
          bookings. Automatic waitlist notifications are not enabled yet.
        </p>
      </div>

      <nav
        aria-label="Waitlist status filters"
        className="mt-7 flex flex-wrap gap-2"
      >
        {filters.map((filter) => {
          const active = status === filter.value;

          return (
            <Link
              key={filter.value}
              href={listUrl(filter.value)}
              prefetch={false}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-4 py-3 text-sm font-bold transition ${
                active
                  ? "bg-[#173A2C] text-[#F4F0E5]"
                  : "border border-[#173A2C]/25 hover:bg-[#E8EBDD]"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-black">
          {filters.find((filter) => filter.value === status)?.label}
          {" "}({total})
        </h2>

        <Link
          href={listUrl(status, page)}
          prefetch={false}
          className="rounded-full border border-[#173A2C]/25 px-5 py-3 text-sm font-bold"
        >
          Refresh list
        </Link>
      </div>

      <div className="mt-6 space-y-4">
        {entries.length === 0 && (
          <p className="rounded-2xl bg-[#E8EBDD] p-6">
            No matching waitlist entries on this page.
          </p>
        )}

        {entries.map((entry) => {
          const member = members.get(entry.member_id);
          const session = sessions.get(entry.session_id);

          const sessionOpen =
            session?.status === "published" &&
            Date.parse(session.starts_at) > now;

          const memberActive = member?.status === "active";

          return (
            <article
              key={entry.id}
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
                    entry.status === "waiting"
                      ? "bg-[#C96632]/15 text-[#8D3E21]"
                      : "bg-[#E8EBDD] text-[#173A2C]"
                  }`}
                >
                  {labels[entry.status] ?? entry.status}
                </span>
              </div>

              <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-bold">Session</dt>
                  <dd className="mt-1 text-[#52645A]">
                    {session
                      ? `${session.session_number}. ${sessionTitle(
                          session.session_number,
                        )}`
                      : "Session unavailable"}
                  </dd>
                </div>

                <div>
                  <dt className="font-bold">Starts</dt>
                  <dd className="mt-1 text-[#52645A]">
                    {session
                      ? displaySessionDate(session.starts_at)
                      : "Unavailable"}
                  </dd>
                </div>

                <div>
                  <dt className="font-bold">Venue / delivery</dt>
                  <dd className="mt-1 break-words text-[#52645A]">
                    {session?.venue_name ?? "Unavailable"}
                  </dd>
                </div>

                <div>
                  <dt className="font-bold">Joined waitlist</dt>
                  <dd className="mt-1 text-[#52645A]">
                    {displaySessionDate(entry.joined_at)}
                  </dd>
                </div>
              </dl>

              {entry.status !== "waiting" && (
                <p className="mt-4 text-xs text-[#52645A]">
                  Last changed: {displaySessionDate(entry.updated_at)}
                </p>
              )}

              {entry.status === "waiting" &&
                (!sessionOpen || !memberActive) && (
                  <p className="mt-5 rounded-xl bg-[#C96632]/10 p-4 text-sm leading-relaxed">
                    Review needed:{" "}
                    {!memberActive
                      ? "this member is not currently active. "
                      : ""}
                    {!sessionOpen
                      ? "this session has started or is no longer published."
                      : ""}
                  </p>
                )}

              <div className="mt-5 flex flex-wrap gap-5 text-sm font-bold">
                <Link
                  href={`/admin/members?edit=${entry.member_id}#member-form`}
                  prefetch={false}
                  className="underline underline-offset-4"
                >
                  View member
                </Link>

                <Link
                  href={`/admin/sessions?edit=${entry.session_id}#session-form`}
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
        aria-label="Waitlist pages"
        className="mt-7 flex flex-wrap items-center justify-between gap-4 text-sm font-semibold"
      >
        {page > 1 ? (
          <Link
            href={listUrl(status, page - 1)}
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
            href={listUrl(status, page + 1)}
            prefetch={false}
            className="rounded-full border border-[#173A2C]/25 px-5 py-3"
          >
            Next →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}