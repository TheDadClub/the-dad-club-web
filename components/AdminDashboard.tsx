import Link from "next/link";
import { requireAdmin } from "../lib/admin";

type SearchParams = Promise<{
  page?: string | string[];
}>;

type Registration = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  location: string;
  stage: string;
  message: string;
  confirmation_email_status: string;
};

const pageSize = 25;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Adelaide",
  }).format(new Date(value));
}

const emailLabels: Record<string, string> = {
  sent: "Accepted for sending",
  failed: "Send not confirmed",
  pending: "Pending",
  not_requested: "Not requested",
};

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { user, database } = await requireAdmin();
  const params = await searchParams;

  const rawPage = typeof params.page === "string" ? params.page : "1";
  const requestedPage = Number(rawPage);
  const page =
    Number.isSafeInteger(requestedPage) &&
    requestedPage > 0 &&
    requestedPage <= 100_000
      ? requestedPage
      : 1;

  const start = (page - 1) * pageSize;

  const [registrationsResult, failedResult] = await Promise.all([
    database
      .from("interest_registrations")
      .select(
        "id, created_at, name, email, location, stage, message, confirmation_email_status",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(start, start + pageSize - 1),

    database
      .from("interest_registrations")
      .select("id", { count: "exact", head: true })
      .eq("confirmation_email_status", "failed"),
  ]);

  if (registrationsResult.error || failedResult.error) {
    throw new Error("Unable to load registrations. Please try again.");
  }

  const registrations =
    (registrationsResult.data ?? []) as Registration[];

  const total = registrationsResult.count ?? 0;
  const failed = failedResult.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="min-h-screen bg-[#F4F0E5] text-[#173A2C]">
      <main className="mx-auto max-w-6xl px-5 py-10 md:px-10">
        <h1 className="text-4xl font-black tracking-tight">
          Interest registrations
        </h1>

        <p className="mt-4 max-w-3xl leading-relaxed text-[#52645A]">
          Review enquiries from dads interested in joining The Dad Club.
        </p>

        <p className="mt-3 break-all text-sm text-[#52645A]">
          Signed in as {user.email}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-[#173A2C]/15 bg-[#FBF8F0] p-6">
            <p className="text-sm font-semibold">Interest registrations</p>
            <p className="mt-3 text-4xl font-black">{total}</p>
          </div>

          <div className="rounded-2xl border border-[#173A2C]/15 bg-[#FBF8F0] p-6">
            <p className="text-sm font-semibold">
              Confirmation sends needing review
            </p>
            <p className="mt-3 text-4xl font-black">{failed}</p>
            <p className="mt-2 text-xs text-[#52645A]">
              Check sending history in Resend before retrying.
            </p>
          </div>
        </div>

        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-2xl font-black">Interest list</h2>
            <Link
              href={`/admin?page=${page}`}
              prefetch={false}
              className="rounded-full border border-[#173A2C]/25 px-5 py-3 text-sm font-bold"
            >
              Refresh list
            </Link>
          </div>

          <p className="mt-3 text-sm leading-relaxed text-[#52645A]">
            Newest first. Dates use Adelaide time. This view is
            read-only; no messages are sent when you open it.
          </p>

          <div className="mt-6 space-y-4">
            {registrations.length === 0 && (
              <p className="rounded-2xl bg-[#E8EBDD] p-6">
                No registrations on this page.
              </p>
            )}

            {registrations.map((registration) => (
              <article
                key={registration.id}
                className="rounded-[24px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="break-words text-xl font-black">
                      {registration.name}
                    </h3>
                    <p className="mt-2 break-all text-sm text-[#52645A]">
                      {registration.email}
                    </p>
                  </div>

                  <p className="text-xs text-[#52645A]">
                    {formatDate(registration.created_at)}
                  </p>
                </div>

                <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-3">
                  <div>
                    <dt className="font-bold">Location</dt>
                    <dd className="mt-1 break-words text-[#52645A]">
                      {registration.location}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold">Stage</dt>
                    <dd className="mt-1 text-[#52645A]">
                      {registration.stage}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-bold">Confirmation email</dt>
                    <dd className="mt-1 text-[#52645A]">
                      {emailLabels[registration.confirmation_email_status] ??
                        "Unknown"}
                    </dd>
                  </div>
                </dl>

                {registration.message && (
                  <details className="mt-5 border-t border-[#173A2C]/10 pt-4">
                    <summary className="cursor-pointer text-sm font-bold">
                      View enquiry message
                    </summary>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#52645A]">
                      {registration.message}
                    </p>
                  </details>
                )}
              </article>
            ))}
          </div>

          <nav
            aria-label="Registration pages"
            className="mt-7 flex flex-wrap items-center justify-between gap-4 text-sm font-semibold"
          >
            {page > 1 ? (
              <Link
                href={`/admin?page=${page - 1}`}
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
                href={`/admin?page=${page + 1}`}
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