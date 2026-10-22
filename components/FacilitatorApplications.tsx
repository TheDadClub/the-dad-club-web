import Link from "next/link";
import { requireAdmin } from "../lib/admin";
import {
  facilitatorApplicationStatuses,
  facilitatorDeliveryModes,
  facilitatorExperienceFields,
  type FacilitatorApplicationStatus,
  type FacilitatorApplicationSource,
  type FacilitatorDeliveryMode,
} from "../lib/facilitatorApplications";

export type ApplicationSearchParams = Promise<{
  page?: string | string[];
}>;

type Application = {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  service_areas: string;
  delivery_modes: FacilitatorDeliveryMode[];
  availability: string;
  professional_experience: string;
  qualifications: string;
  group_experience: string;
  motivation: string;
  source: FacilitatorApplicationSource;
  status: FacilitatorApplicationStatus;
  consent_version: string;
};

const pageSize = 25;

const applicationFields = [
  "id",
  "created_at",
  "name",
  "email",
  "phone",
  "location",
  "service_areas",
  "delivery_modes",
  "availability",
  "professional_experience",
  "qualifications",
  "group_experience",
  "motivation",
  "source",
  "status",
  "consent_version",
].join(",");

const sourceLabels: Record<FacilitatorApplicationSource, string> = {
  website: "Website",
  app: "App",
  "app-referral": "App referral",
};

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Adelaide",
  }).format(new Date(value));
}

function statusLabel(value: string) {
  return (
    facilitatorApplicationStatuses.find(
      (status) => status.value === value,
    )?.label ?? "Unknown"
  );
}

function deliveryLabel(value: string) {
  return (
    facilitatorDeliveryModes.find(
      (mode) => mode.value === value,
    )?.label ?? "Unknown"
  );
}

export default async function FacilitatorApplications({
  searchParams,
}: {
  searchParams: ApplicationSearchParams;
}) {
  // Authorise before querying any application information.
  const { database } = await requireAdmin();
  const params = await searchParams;

  const rawPage =
    typeof params.page === "string" ? params.page : "1";

  const requestedPage = Number(rawPage);

  const page =
    Number.isSafeInteger(requestedPage) &&
    requestedPage > 0 &&
    requestedPage <= 100000
      ? requestedPage
      : 1;

  const offset = (page - 1) * pageSize;

  const { data, count, error } = await database
    .from("facilitator_applications")
    .select(applicationFields, { count: "exact" })
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) {
    throw new Error(
      "Unable to load facilitator applications. Please try again.",
    );
  }

  const applications = (data ?? []) as unknown as Application[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-10 text-[#173A2C] md:px-10">
      <h1 className="text-4xl font-black tracking-tight">
        Facilitator applications
      </h1>

      <p className="mt-4 max-w-3xl leading-relaxed text-[#52645A]">
        Review expressions of interest from people interested in
        supporting first-time fathers.
      </p>

      <p className="mt-4 rounded-xl bg-[#E8EBDD] p-4 text-sm leading-relaxed">
        This view is read-only. Opening an application does not send
        an email, approve the applicant or create a facilitator login.
      </p>

      <section
        className="mt-8"
        aria-labelledby="application-list-heading"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2
            id="application-list-heading"
            className="text-2xl font-black"
          >
            Applications ({total})
          </h2>

          <Link
            href={`/admin/facilitators?page=${page}`}
            prefetch={false}
            className="rounded-full border border-[#173A2C]/25 px-5 py-3 text-sm font-bold"
          >
            Refresh list
          </Link>
        </div>

        <p className="mt-3 text-sm text-[#52645A]">
          Newest first. Dates use Adelaide time. Showing up to 25
          applications per page.
        </p>

        <div className="mt-6 space-y-5">
          {applications.map((application) => (
            <article
              key={application.id}
              className="rounded-[24px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6 sm:p-8"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="break-words text-xl font-black">
                    {application.name}
                  </h3>

                  <a
                    href={`mailto:${encodeURIComponent(application.email)}`}
                    className="mt-2 inline-block break-all text-sm underline underline-offset-4"
                  >
                    {application.email}
                  </a>

                  <p className="mt-2 break-words text-sm text-[#52645A]">
                    {application.phone}
                  </p>
                </div>

                <div className="space-y-3">
                  <span className="inline-block rounded-full bg-[#E8EBDD] px-4 py-2 text-xs font-bold">
                    {statusLabel(application.status)}
                  </span>

                  <p className="text-xs text-[#52645A]">
                    {displayDate(application.created_at)}
                  </p>
                </div>
              </div>

              <dl className="mt-6 grid gap-5 text-sm sm:grid-cols-3">
                <div>
                  <dt className="font-bold">Location</dt>
                  <dd className="mt-1 break-words text-[#52645A]">
                    {application.location}
                  </dd>
                </div>

                <div>
                  <dt className="font-bold">Delivery preferences</dt>
                  <dd className="mt-1 text-[#52645A]">
                    {application.delivery_modes
                      .map(deliveryLabel)
                      .join(" and ")}
                  </dd>
                </div>

                <div>
                  <dt className="font-bold">Application source</dt>
                  <dd className="mt-1 text-[#52645A]">
                    {sourceLabels[application.source] ?? "Unknown"}
                  </dd>
                </div>
              </dl>

              <details className="mt-6 border-t border-[#173A2C]/15 pt-5">
                <summary className="cursor-pointer text-sm font-bold">
                  View availability, experience and application answers
                </summary>

                <dl className="mt-6 space-y-6">
                  {facilitatorExperienceFields.map((field) => (
                    <div key={field.name}>
                      <dt className="text-sm font-bold">
                        {field.label}
                      </dt>

                      <dd className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#52645A]">
                        {application[field.name] || "Not provided"}
                      </dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-6 border-t border-[#173A2C]/10 pt-4 text-xs text-[#52645A]">
                  Recruitment contact consent recorded.
                  Wording version: {application.consent_version}.
                </p>
              </details>
            </article>
          ))}

          {applications.length === 0 && (
            <p className="rounded-2xl bg-[#E8EBDD] p-6">
              {total === 0
                ? "No applications yet. New submissions will appear here."
                : "No applications on this page."}
            </p>
          )}
        </div>

        <nav
          aria-label="Facilitator application pages"
          className="mt-7 flex flex-wrap items-center justify-between gap-4 text-sm font-semibold"
        >
          {page > 1 ? (
            <Link
              href={`/admin/facilitators?page=${page - 1}`}
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
              href={`/admin/facilitators?page=${page + 1}`}
              prefetch={false}
              className="rounded-full border border-[#173A2C]/25 px-5 py-3"
            >
              Next →
            </Link>
          ) : (
            <span />
          )}

          {page > totalPages && (
            <Link
              href="/admin/facilitators"
              prefetch={false}
              className="underline underline-offset-4"
            >
              First page
            </Link>
          )}
        </nav>
      </section>
    </main>
  );
}