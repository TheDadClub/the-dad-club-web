
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "../../../lib/admin";

import {
  EMAIL_HEALTH_LABELS,
  EMAIL_HEALTH_ISSUE_LABELS,
  EMAIL_HEALTH_THRESHOLDS,
  type EmailHealthType,
  type EmailHealthIssueType,
} from "../../../lib/emailHealthTypes";

import {
  acknowledgeEmailHealthIssue,
} from "./actions";

export const metadata: Metadata = {
  title: "Email Health | The Dad Club Admin",
  robots: {
    index: false,
    follow: false,
  },
};

type SearchParams = Promise<{
  status?: string | string[];
  severity?: string | string[];
  email_type?: string | string[];
  page?: string | string[];
  alert_page?: string | string[];
  saved?: string | string[];
  error?: string | string[];
}>;

type Filters = {
  status: string;
  severity: string;
  emailType: string;
  page: number;
  alertPage: number;
};

const pageSize = 20;

const panelClass =
  "rounded-[24px] border border-[#173A2C]/15 bg-[#FBF8F0] p-5 sm:p-6";

const buttonClass =
  "inline-flex min-h-12 items-center justify-center rounded-full bg-[#173A2C] px-5 py-3 text-sm font-bold text-[#F4F0E5] transition hover:bg-[#245540]";

const secondaryButtonClass =
  "inline-flex min-h-12 items-center justify-center rounded-full border border-[#173A2C]/25 px-5 py-3 text-sm font-bold hover:bg-[#E8EBDD]";

const selectClass =
  "mt-2 w-full rounded-xl border border-[#173A2C]/25 bg-[#F4F0E5] px-4 py-3 text-base";

const processorLabels: Record<string, string> = {
  session_reminders: "Session reminders",
  waitlist_notifications: "Waitlist notifications",
  email_health_monitor: "Email health monitor",
};

const statusLabels: Record<string, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
  pending: "Pending",
  processing: "Processing",
  accepted: "Accepted by provider",
  failed: "Failed",
  not_confirmed: "Not confirmed",
  not_started: "Not started",
  running: "Running",
  success: "Successful",
  disabled: "Disabled",
  inactive: "Inactive",
  critical: "Critical",
  warning: "Warning",
};

const errors: Record<string, string> = {
  invalid: "The acknowledgement request was invalid.",
  stale:
    "This issue has changed since you opened the page. Review the latest details before acknowledging it.",
  save:
    "The acknowledgement could not be saved. Please try again.",
};

function displayDate(value: string | null | undefined) {
  if (!value) return "—";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Adelaide",
  }).format(date);
}

function parsePage(value: unknown) {
  if (
    typeof value !== "string" ||
    !/^\d+$/.test(value)
  ) {
    return 1;
  }

  const page = Number(value);

  return Number.isSafeInteger(page) &&
    page >= 1 &&
    page <= 100000
    ? page
    : 1;
}

function emailLabel(value: string) {
  return (
    EMAIL_HEALTH_LABELS[value as EmailHealthType] ??
    value
  );
}

function issueLabel(value: string) {
  return (
    EMAIL_HEALTH_ISSUE_LABELS[
      value as EmailHealthIssueType
    ] ?? value
  );
}

function dashboardUrl(filters: Filters) {
  const query = new URLSearchParams();

  query.set("status", filters.status);

  if (filters.severity) {
    query.set("severity", filters.severity);
  }

  if (filters.emailType) {
    query.set("email_type", filters.emailType);
  }

  if (filters.page > 1) {
    query.set("page", String(filters.page));
  }

  if (filters.alertPage > 1) {
    query.set(
      "alert_page",
      String(filters.alertPage),
    );
  }

  return `/admin/emails?${query.toString()}`;
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const concerning = [
    "failed",
    "critical",
    "not_confirmed",
    "inactive",
  ].includes(status);

  const neutral = [
    "disabled",
    "not_started",
    "pending",
    "processing",
    "running",
    "warning",
  ].includes(status);

  const style = concerning
    ? "bg-[#C96632]/15 text-[#8A3D20]"
    : neutral
      ? "bg-[#173A2C]/10 text-[#52645A]"
      : "bg-[#E8EBDD] text-[#173A2C]";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-2 text-xs font-bold ${style}`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div>
      <dt className="text-xs font-bold text-[#52645A]">
        {label}
      </dt>

      <dd className="mt-1 break-words text-sm">
        {value ?? "—"}
      </dd>
    </div>
  );
}

function Pagination({
  filters,
  total,
  kind,
}: {
  filters: Filters;
  total: number;
  kind: "issues" | "alerts";
}) {
  const page =
    kind === "issues"
      ? filters.page
      : filters.alertPage;

  const hasNext = page * pageSize < total;

  const anchor =
    kind === "issues"
      ? "#email-issues"
      : "#alert-history";

  function pageUrl(nextPage: number) {
    return (
      dashboardUrl({
        ...filters,
        ...(kind === "issues"
          ? { page: nextPage }
          : { alertPage: nextPage }),
      }) + anchor
    );
  }

  if (page === 1 && !hasNext) {
    return null;
  }

  return (
    <nav
      aria-label={`${kind} pages`}
      className="mt-6 flex flex-wrap items-center justify-between gap-4"
    >
      {page > 1 ? (
        <Link
          href={pageUrl(page - 1)}
          prefetch={false}
          className={secondaryButtonClass}
        >
          ← Previous
        </Link>
      ) : (
        <span />
      )}

      <p className="text-sm font-bold">
        Page {page}
      </p>

      {hasNext ? (
        <Link
          href={pageUrl(page + 1)}
          prefetch={false}
          className={secondaryButtonClass}
        >
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

async function EmailHealthDashboard({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { database } = await requireAdmin();

  const params = await searchParams;

  const filters: Filters = {
    status:
      typeof params.status === "string" &&
      [
        "open",
        "acknowledged",
        "resolved",
        "all",
      ].includes(params.status)
        ? params.status
        : "open",

    severity:
      typeof params.severity === "string" &&
      ["warning", "critical"].includes(
        params.severity,
      )
        ? params.severity
        : "",

    emailType:
      typeof params.email_type === "string" &&
      Object.prototype.hasOwnProperty.call(
        EMAIL_HEALTH_LABELS,
        params.email_type,
      )
        ? params.email_type
        : "",

    page: parsePage(params.page),

    alertPage: parsePage(params.alert_page),
  };

  const offset =
    (filters.page - 1) * pageSize;

  const alertOffset =
    (filters.alertPage - 1) * pageSize;

  let issuesQuery = database
    .from("email_health_issues")
    .select(
      "id,email_type,issue_type,severity,status,source_table,source_id,source_status,error_code,occurrence_count,first_detected_at,last_detected_at,acknowledged_at,resolved_at",
      { count: "exact" },
    );

  if (filters.status !== "all") {
    issuesQuery = issuesQuery.eq(
      "status",
      filters.status,
    );
  }

  if (filters.severity) {
    issuesQuery = issuesQuery.eq(
      "severity",
      filters.severity,
    );
  }

  if (filters.emailType) {
    issuesQuery = issuesQuery.eq(
      "email_type",
      filters.emailType,
    );
  }

  const [
    settingsResult,
    processorsResult,
    openResult,
    criticalResult,
    acknowledgedResult,
    resolvedResult,
    issuesResult,
    alertsResult,
  ] = await Promise.all([
    database
      .from("email_health_settings")
      .select("enabled,monitoring_started_at")
      .eq("id", 1)
      .maybeSingle(),

    database
      .from("email_processor_health")
      .select(
        "processor_name,last_status,last_started_at,last_finished_at,last_success_at,last_failure_at,last_error_code,consecutive_failures",
      )
      .order("processor_name"),

    database
      .from("email_health_issues")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "open"),

    database
      .from("email_health_issues")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("severity", "critical")
      .in("status", ["open", "acknowledged"]),

    database
      .from("email_health_issues")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "acknowledged"),

    database
      .from("email_health_issues")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("status", "resolved"),

    issuesQuery
      .order("last_detected_at", {
        ascending: false,
      })
      .order("id", { ascending: false })
      .range(offset, offset + pageSize - 1),

    database
      .from("email_health_alerts")
      .select(
        "id,status,attempt_count,created_at,first_attempt_at,attempted_at,accepted_at,next_attempt_at,provider_message_id,last_error_code",
        { count: "exact" },
      )
      .order("created_at", {
        ascending: false,
      })
      .order("id", { ascending: false })
      .range(
        alertOffset,
        alertOffset + pageSize - 1,
      ),
  ]);

  const results = [
    settingsResult,
    processorsResult,
    openResult,
    criticalResult,
    acknowledgedResult,
    resolvedResult,
    issuesResult,
    alertsResult,
  ];

  const loadFailed =
    results.some((result) => Boolean(result.error)) ||
    !settingsResult.data;

  if (loadFailed) {
    console.error(
      "Email health dashboard loading failed.",
      results
        .filter((result) => result.error)
        .map((result) => result.error?.code),
    );

    return (
      <main className="mx-auto max-w-6xl px-5 py-10 text-[#173A2C] md:px-10">
        <h1 className="text-3xl font-black">
          Email Health
        </h1>

        <div
          role="alert"
          className="mt-6 rounded-2xl border border-[#C96632]/40 bg-[#C96632]/10 p-6"
        >
          Email health information could not be
          loaded. Refresh the page and try again.
        </div>
      </main>
    );
  }

  const settings = settingsResult.data!;

  const processors = processorsResult.data ?? [];

  const issues = issuesResult.data ?? [];

  const alerts = alertsResult.data ?? [];

  const summary = [
    {
      label: "Open issues",
      count: openResult.count ?? 0,
    },
    {
      label: "Unresolved critical issues",
      count: criticalResult.count ?? 0,
    },
    {
      label: "Acknowledged",
      count: acknowledgedResult.count ?? 0,
    },
    {
      label: "Resolved",
      count: resolvedResult.count ?? 0,
    },
  ];

  const errorMessage =
    typeof params.error === "string" &&
    Object.prototype.hasOwnProperty.call(
      errors,
      params.error,
    )
      ? errors[params.error]
      : undefined;

  const now = Date.now();

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 text-[#173A2C] md:px-10">

      {/* PAGE HEADER */}

      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-extrabold tracking-[0.16em] text-[#C96632]">
            ADMINISTRATION
          </p>

          <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
            Email Health
          </h1>

          <p className="mt-4 max-w-2xl leading-relaxed text-[#52645A]">
            Monitor automated emails, review
            sending issues and track scheduled
            processor health.
          </p>
        </div>

        <Link
          href={dashboardUrl(filters)}
          prefetch={false}
          className={secondaryButtonClass}
        >
          Refresh dashboard
        </Link>
      </div>

      {/* MONITORING STATUS */}

      <section
        aria-label="Monitoring status"
        className={`mt-8 ${panelClass}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-black">
            Monitoring status
          </h2>

          <StatusBadge
            status={
              settings.enabled
                ? "enabled"
                : "disabled"
            }
          />
        </div>

        <p className="mt-3 text-sm leading-relaxed text-[#52645A]">
          {settings.enabled
            ? "Email health monitoring is enabled. Scheduled executions are intended to run every 15 minutes."
            : "Email health monitoring is currently disabled. No new administrator alerts will be initiated by the monitor."}
        </p>

        <p className="mt-3 text-sm">
          Monitoring started:{" "}
          <strong>
            {displayDate(
              settings.monitoring_started_at,
            )}
          </strong>
        </p>

        <p className="mt-2 text-xs text-[#52645A]">
          All dates and times use Australian
          Central time.
        </p>
      </section>

      {/* SUMMARY CARDS */}

      <section
        aria-label="Email issue summary"
        className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4"
      >
        {summary.map((item) => (
          <article
            key={item.label}
            className={panelClass}
          >
            <p className="text-sm font-bold text-[#52645A]">
              {item.label}
            </p>

            <p className="mt-3 text-4xl font-black tabular-nums">
              {item.count}
            </p>
          </article>
        ))}
      </section>

      {/* PROCESSOR HEALTH */}

      <section className="mt-10">
        <h2 className="text-2xl font-black">
          Scheduled processor health
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-[#52645A]">
          Review the latest recorded executions.
          A successful execution does not
          necessarily mean every individual email
          was accepted.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {Object.entries(processorLabels).map(
            ([name, label]) => {
              const processor = processors.find(
                (item) =>
                  item.processor_name === name,
              );

              const enabled =
                name === "session_reminders"
                  ? process.env
                      .SESSION_REMINDERS_ENABLED ===
                    "true"
                  : name === "waitlist_notifications"
                    ? process.env
                        .WAITLIST_EMAILS_ENABLED ===
                      "true"
                    : settings.enabled === true;

              const referenceTime =
                processor?.last_started_at ??
                settings.monitoring_started_at;

              const inactive =
                enabled &&
                referenceTime &&
                now - Date.parse(referenceTime) >
                  EMAIL_HEALTH_THRESHOLDS
                    .processorInactiveMinutes *
                    60_000;

              const status = !enabled
                ? "disabled"
                : inactive
                  ? "inactive"
                  : processor?.last_status ??
                    "not_started";

              return (
                <article
                  key={name}
                  className={panelClass}
                >
                  <h3 className="font-black">
                    {label}
                  </h3>

                  <div className="mt-3">
                    <StatusBadge status={status} />
                  </div>

                  <dl className="mt-5 space-y-4">
                    <Detail
                      label="Last started"
                      value={displayDate(
                        processor?.last_started_at,
                      )}
                    />

                    <Detail
                      label="Last finished"
                      value={displayDate(
                        processor?.last_finished_at,
                      )}
                    />

                    <Detail
                      label="Last successful execution"
                      value={displayDate(
                        processor?.last_success_at,
                      )}
                    />

                    <Detail
                      label="Last failure"
                      value={displayDate(
                        processor?.last_failure_at,
                      )}
                    />

                    <Detail
                      label="Consecutive failures"
                      value={
                        processor?.consecutive_failures
                      }
                    />

                    <Detail
                      label="Last error code"
                      value={
                        processor?.last_error_code
                      }
                    />
                  </dl>
                </article>
              );
            },
          )}
        </div>
      </section>

      {/* EMAIL ISSUES */}

      <section
        id="email-issues"
        className="mt-12 scroll-mt-6"
      >
        <h2 className="text-2xl font-black">
          Detected email issues
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-[#52645A]">
          Acknowledge issues after reviewing them.
          Acknowledgement does not resolve an issue
          or resend an email.
        </p>

        <div className={`mt-5 ${panelClass}`}>
          <form
            action="/admin/emails"
            method="get"
            className="grid gap-4 md:grid-cols-3"
          >
            <div>
              <label
                htmlFor="issue-status"
                className="text-sm font-bold"
              >
                Issue status
              </label>

              <select
                id="issue-status"
                name="status"
                defaultValue={filters.status}
                className={selectClass}
              >
                <option value="open">
                  Open
                </option>
                <option value="acknowledged">
                  Acknowledged
                </option>
                <option value="resolved">
                  Resolved
                </option>
                <option value="all">
                  All statuses
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="issue-severity"
                className="text-sm font-bold"
              >
                Severity
              </label>

              <select
                id="issue-severity"
                name="severity"
                defaultValue={filters.severity}
                className={selectClass}
              >
                <option value="">
                  All severities
                </option>
                <option value="critical">
                  Critical
                </option>
                <option value="warning">
                  Warning
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="issue-email-type"
                className="text-sm font-bold"
              >
                Email category
              </label>

              <select
                id="issue-email-type"
                name="email_type"
                defaultValue={filters.emailType}
                className={selectClass}
              >
                <option value="">
                  All categories
                </option>

                {Object.entries(
                  EMAIL_HEALTH_LABELS,
                ).map(([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {filters.alertPage > 1 && (
              <input
                type="hidden"
                name="alert_page"
                value={filters.alertPage}
              />
            )}

            <div className="flex flex-wrap gap-3 md:col-span-3">
              <button
                type="submit"
                className={buttonClass}
              >
                APPLY FILTERS
              </button>

              <Link
                href="/admin/emails"
                prefetch={false}
                className={secondaryButtonClass}
              >
                Clear filters
              </Link>
            </div>
          </form>
        </div>

        {params.saved === "saved" && (
          <p
            role="status"
            className="mt-5 rounded-2xl bg-[#E8EBDD] p-5 font-semibold"
          >
            Issue acknowledged. No email was sent.
          </p>
        )}

        {errorMessage && (
          <p
            role="alert"
            className="mt-5 rounded-2xl border border-[#C96632]/40 bg-[#C96632]/10 p-5"
          >
            {errorMessage}
          </p>
        )}

        <p className="mt-6 text-sm font-bold">
          {issuesResult.count ?? 0} matching issues
        </p>

        {issues.length === 0 ? (
          <div className={`mt-4 ${panelClass}`}>
            <p className="font-bold">
              No issues match this view.
            </p>

            {!settings.enabled && (
              <p className="mt-2 text-sm text-[#52645A]">
                Monitoring is disabled. An empty
                list does not establish that all
                automated emails are healthy.
              </p>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {issues.map((issue) => (
              <article
                key={issue.id}
                className={panelClass}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black">
                      {emailLabel(
                        issue.email_type,
                      )}
                    </h3>

                    <p className="mt-2 text-sm font-semibold">
                      {issueLabel(
                        issue.issue_type,
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatusBadge
                      status={issue.severity}
                    />

                    <StatusBadge
                      status={issue.status}
                    />
                  </div>
                </div>

                <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Detail
                    label="First detected"
                    value={displayDate(
                      issue.first_detected_at,
                    )}
                  />

                  <Detail
                    label="Last detected"
                    value={displayDate(
                      issue.last_detected_at,
                    )}
                  />

                  <Detail
                    label="Occurrence"
                    value={issue.occurrence_count}
                  />

                  <Detail
                    label="Source status"
                    value={issue.source_status}
                  />

                  <Detail
                    label="Acknowledged"
                    value={displayDate(
                      issue.acknowledged_at,
                    )}
                  />

                  <Detail
                    label="Resolved"
                    value={displayDate(
                      issue.resolved_at,
                    )}
                  />
                </dl>

                <details className="mt-5 border-t border-[#173A2C]/15 pt-4">
                  <summary className="cursor-pointer text-sm font-bold">
                    Technical details
                  </summary>

                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Detail
                      label="Source table"
                      value={issue.source_table}
                    />

                    <Detail
                      label="Source record ID"
                      value={issue.source_id}
                    />

                    <Detail
                      label="Issue ID"
                      value={issue.id}
                    />

                    <Detail
                      label="Error code"
                      value={issue.error_code}
                    />
                  </dl>
                </details>

                {issue.status === "open" && (
                  <form
                    action={
                      acknowledgeEmailHealthIssue
                    }
                    className="mt-6"
                  >
                    <input
                      type="hidden"
                      name="id"
                      value={issue.id}
                    />

                    <input
                      type="hidden"
                      name="occurrence_count"
                      value={issue.occurrence_count}
                    />

                    <input
                      type="hidden"
                      name="last_detected_at"
                      value={issue.last_detected_at}
                    />

                    <input
                      type="hidden"
                      name="filter_status"
                      value={filters.status}
                    />

                    <input
                      type="hidden"
                      name="filter_severity"
                      value={filters.severity}
                    />

                    <input
                      type="hidden"
                      name="filter_email_type"
                      value={filters.emailType}
                    />

                    <input
                      type="hidden"
                      name="page"
                      value={filters.page}
                    />

                    <input
                      type="hidden"
                      name="alert_page"
                      value={filters.alertPage}
                    />

                    <button
                      type="submit"
                      className={buttonClass}
                    >
                      Acknowledge issue
                    </button>
                  </form>
                )}
              </article>
            ))}
          </div>
        )}

        <Pagination
          filters={filters}
          total={issuesResult.count ?? 0}
          kind="issues"
        />
      </section>

      {/* ADMINISTRATOR ALERT HISTORY */}

      <section
        id="alert-history"
        className="mt-12 scroll-mt-6"
      >
        <h2 className="text-2xl font-black">
          Administrator alert history
        </h2>

        <p className="mt-3 text-sm leading-relaxed text-[#52645A]">
          Review administrator notifications and
          their sending outcomes. Provider
          acceptance does not guarantee inbox
          delivery.
        </p>

        <p className="mt-5 text-sm font-bold">
          {alertsResult.count ?? 0} alerts recorded
        </p>

        {alerts.length === 0 ? (
          <div className={`mt-4 ${panelClass}`}>
            <p className="font-bold">
              No administrator alerts recorded
              on this page.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {alerts.map((alert) => (
              <article
                key={alert.id}
                className={panelClass}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="font-black">
                      Administrator alert
                    </h3>

                    <p className="mt-2 text-sm text-[#52645A]">
                      Created{" "}
                      {displayDate(
                        alert.created_at,
                      )}
                    </p>
                  </div>

                  <StatusBadge
                    status={alert.status}
                  />
                </div>

                <dl className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Detail
                    label="Sending attempts"
                    value={alert.attempt_count}
                  />

                  <Detail
                    label="First attempt"
                    value={displayDate(
                      alert.first_attempt_at,
                    )}
                  />

                  <Detail
                    label="Last attempt"
                    value={displayDate(
                      alert.attempted_at,
                    )}
                  />

                  <Detail
                    label="Accepted by provider"
                    value={displayDate(
                      alert.accepted_at,
                    )}
                  />

                  <Detail
                    label="Next eligible attempt"
                    value={
                      alert.status === "pending"
                        ? displayDate(
                            alert.next_attempt_at,
                          )
                        : "—"
                    }
                  />

                  <Detail
                    label="Last error code"
                    value={alert.last_error_code}
                  />
                </dl>

                {[
                  "failed",
                  "not_confirmed",
                ].includes(alert.status) && (
                  <p className="mt-5 rounded-xl bg-[#C96632]/10 p-4 text-sm font-semibold text-[#8A3D20]">
                    Manual review required. Check
                    the provider records before
                    attempting to send another
                    notification.
                  </p>
                )}

                <details className="mt-5 border-t border-[#173A2C]/15 pt-4">
                  <summary className="cursor-pointer text-sm font-bold">
                    Technical details
                  </summary>

                  <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Detail
                      label="Alert ID"
                      value={alert.id}
                    />

                    <Detail
                      label="Provider message ID"
                      value={
                        alert.provider_message_id
                      }
                    />
                  </dl>
                </details>
              </article>
            ))}
          </div>
        )}

        <Pagination
          filters={filters}
          total={alertsResult.count ?? 0}
          kind="alerts"
        />
      </section>

      {/* SCOPE AND LIMITATIONS */}

      <section className={`mt-12 ${panelClass}`}>
        <h2 className="font-black">
          About email monitoring
        </h2>

        <div className="mt-3 space-y-3 text-sm leading-relaxed text-[#52645A]">
          <p>
            Monitoring covers supported automated
            website emails and scheduled email
            processors from the configured
            monitoring start date.
          </p>

          <p>
            Historical failures, healthcare
            outreach emails and Supabase Auth
            emails are not included in this
            monitoring system.
          </p>

          <p>
            Email delivery, spam placement and
            recipient inbox receipt are not
            currently monitored.
          </p>

          <p>
            Administrator alerts use the same
            email provider as other automated
            emails. A provider outage may prevent
            administrator notifications from
            being sent.
          </p>

          <p>
            No participant emails are automatically
            resent by this dashboard.
          </p>
        </div>
      </section>
    </main>
  );
}

export default function AdminEmailsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <div className="min-h-screen bg-[#F4F0E5]">
      <Suspense
        fallback={
          <main className="mx-auto max-w-6xl px-5 py-10 text-[#173A2C] md:px-10">
            <p
              role="status"
              className="font-bold"
            >
              Loading email health…
            </p>
          </main>
        }
      >
        <EmailHealthDashboard
          searchParams={searchParams}
        />
      </Suspense>
    </div>
  );
}
