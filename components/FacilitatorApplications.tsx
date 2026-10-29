import Link from "next/link";
import { requireAdmin } from "../lib/admin";
import ApplicationStatusForm from "./ApplicationStatusForm";
import ApplicationEmailStatus from "./ApplicationEmailStatus";
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
  status?: string | string[];
  saved?: string | string[];
  error?: string | string[];
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
  reviewed_at: string | null;
  review_version: number;
  acknowledgement_email_status: string;
  acknowledgement_email_accepted_at: string | null;
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
  "reviewed_at",
  "review_version",
  "acknowledgement_email_status",
  "acknowledgement_email_accepted_at",
].join(",");

const sourceLabels: Record<FacilitatorApplicationSource, string> = {
  website: "Website",
  app: "App",
  "app-referral": "App referral",
};

const statusStyles: Record<FacilitatorApplicationStatus, string> = {
  new: "bg-[#E8EBDD] text-[#173A2C]",
  reviewing: "bg-[#C96632]/15 text-[#8D3E21]",
  contacted: "bg-[#173A2C] text-[#F4F0E5]",
  closed: "bg-[#173A2C]/10 text-[#52645A]",
};

const errorMessages: Record<string, string> = {
  invalid: "Please choose a valid application status and try again.",
  stale:
    "The application has changed, is no longer available, or already has that status. The list has been refreshed. Check its current status before trying again.",
  save:
    "The status could not be saved. Please refresh the list and try again.",
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

function listHref(status?: string, page = 1) {
  const query = new URLSearchParams();

  if (status) {
    query.set("status", status);
  }

  if (page > 1) {
    query.set("page", String(page));
  }

  const suffix = query.toString();

  return `/admin/facilitators${suffix ? `?${suffix}` : ""}`;
}

export default async function FacilitatorApplications({
  searchParams,
}: {
  searchParams: ApplicationSearchParams;
}) {
  // Authorise before querying any application information.
  const { database } = await requireAdmin();
  const params = await searchParams;

  const activeStatus = facilitatorApplicationStatuses.find(
    (item) => item.value === params.status,
  )?.value;

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

  let query = database
    .from("facilitator_applications")
    .select(applicationFields, { count: "exact" });

  if (activeStatus) {
    query = query.eq("status", activeStatus);
  }

  const { data, count, error } = await query
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

  const errorCode =
    typeof params.error === "string" ? params.error : "";

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-10 text-[#173A2C] md:px-10">
      <h1 className="text-4xl font-black tracking-tight">
        Facilitator applications
      </h1>

      <p className="mt-4 max-w-3xl leading-relaxed text-[#52645A]">
        Review expressions of interest and keep track of recruitment.
      </p>

      <div className="mt-4 space-y-2 rounded-xl bg-[#E8EBDD] p-4 text-sm leading-relaxed">
        <p>
          <strong>New:</strong> awaiting review.{" "}
          <strong>Reviewing:</strong> being assessed.{" "}
          <strong>Contacted:</strong> you have contacted the applicant.{" "}
          <strong>Closed:</strong> no further action planned for now.
        </p>

        <p>
          These are internal tracking statuses. Contacted does not
          send an email, and no status approves someone to facilitate.
          Closed applications remain on record and can be reopened.
        </p>

        <p>
          Acknowledgement email status is tracked separately.
          Changing a recruitment status does not send or resend it.
        </p>
      </div>

      {params.saved === "1" && (
        <p
          role="status"
          className="mt-6 rounded-xl bg-[#E8EBDD] p-4 font-bold"
        >
          Application status saved. It may have moved out of the
          selected filter.
        </p>
      )}

      {errorCode && (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-[#C96632]/10 p-4 text-sm leading-relaxed"
        >
          {errorMessages[errorCode] ??
            "Something went wrong. Refresh the list and try again."}
        </p>
      )}

      <nav
        aria-label="Filter applications by status"
        className="mt-8 flex flex-wrap gap-2"
      >
        <Link
          href="/admin/facilitators"
          prefetch={false}
          aria-current={!activeStatus ? "page" : undefined}
          className={`rounded-full px-5 py-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C96632] ${
            !activeStatus
              ? "bg-[#173A2C] text-[#F4F0E5]"
              : "bg-[#E8EBDD] hover:bg-[#173A2C]/10"
          }`}
        >
          All
        </Link>

        {facilitatorApplicationStatuses.map((item) => {
          const active = activeStatus === item.value;

          return (
            <Link
              key={item.value}
              href={listHref(item.value)}
              prefetch={false}
              aria-current={active ? "page" : undefined}
              className={`rounded-full px-5 py-3 text-sm font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C96632] ${
                active
                  ? "bg-[#173A2C] text-[#F4F0E5]"
                  : "bg-[#E8EBDD] hover:bg-[#173A2C]/10"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>

      <section
        className="mt-8"
        aria-labelledby="application-list-heading"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2
            id="application-list-heading"
            className="text-2xl font-black"
          >
            {activeStatus
              ? `${statusLabel(activeStatus)} applications`
              : "All applications"}{" "}
            ({total})
          </h2>

          <Link
            href={listHref(activeStatus, page)}
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
                  <span
                    className={`inline-block rounded-full px-4 py-2 text-xs font-bold ${
                      statusStyles[application.status] ??
                      "bg-[#E8EBDD] text-[#173A2C]"
                    }`}
                  >
                    {statusLabel(application.status)}
                  </span>

                  <p className="text-xs text-[#52645A]">
                    Applied {displayDate(application.created_at)}
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

              <ApplicationEmailStatus
                status={application.acknowledgement_email_status}
                acceptedAt={application.acknowledgement_email_accepted_at}
              />

              <ApplicationStatusForm
                key={`${application.id}:${application.review_version}`}
                applicationId={application.id}
                currentStatus={application.status}
                reviewVersion={application.review_version}
                filter={activeStatus ?? "all"}
                page={page}
              />

              {application.reviewed_at && (
                <p className="mt-3 text-xs text-[#52645A]">
                  Last status change:{" "}
                  {displayDate(application.reviewed_at)}
                </p>
              )}

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
              {page > 1
                ? "No applications on this page. Return to the first page."
                : activeStatus
                  ? "No applications currently match this status."
                  : "No applications yet. New submissions will appear here."}
            </p>
          )}
        </div>

        <nav
          aria-label="Facilitator application pages"
          className="mt-7 flex flex-wrap items-center justify-between gap-4 text-sm font-semibold"
        >
          {page > 1 ? (
            <Link
              href={listHref(activeStatus, page - 1)}
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
              href={listHref(activeStatus, page + 1)}
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
              href={listHref(activeStatus)}
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