
import { Suspense } from "react";
import type { Metadata } from "next";
import { requireAdmin } from "../../../lib/admin";
import AddContactForm from "./AddContactForm";
import HealthcareDirectory, {
  type HealthcareReferral,
  type HealthcareCommunication,
} from "./HealthcareDirectory";

export const metadata: Metadata = {
  title: "Healthcare Referrals | The Dad Club",
  robots: {
    index: false,
    follow: false,
  },
};

const MAILBOX = "hello@thedadclub.com.au";

type ReferralWithTimestamps = HealthcareReferral & {
  last_contacted_at: string | null;
  last_response_at: string | null;
};

function formatDateTime(
  value: string | null | undefined
): string {
  if (!value) {
    return "Never";
  }

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Adelaide",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getAdelaideDate(): string {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Adelaide",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find(
    (part) => part.type === "year"
  )?.value;

  const month = parts.find(
    (part) => part.type === "month"
  )?.value;

  const day = parts.find(
    (part) => part.type === "day"
  )?.value;

  return `${year}-${month}-${day}`;
}

async function HealthcareContent() {
  const { user, database } = await requireAdmin();

  const [
    referralResult,
    connectionResult,
    syncResult,
    outboundResult,
    inboundResult,
    historyResult,
  ] = await Promise.all([
    database
      .from("healthcare_referrals")
      .select(
        "id, organisation_name, contact_name, category, email, phone, website, suburb, state, priority, status, notes, follow_up_at, last_contacted_at, last_response_at",
        { count: "exact" }
      )
      .order("organisation_name", {
        ascending: true,
      })
      .limit(500),

    database
      .from("microsoft_connections")
      .select(
        "mailbox_email, updated_at"
      )
      .eq("mailbox_email", MAILBOX)
      .maybeSingle(),

    database
      .from("outreach_sync_settings")
      .select(
        "enabled, last_status, last_started_at, last_finished_at, last_success_at, last_failure_at, last_error_code, consecutive_failures, lease_expires_at"
      )
      .eq("id", 1)
      .maybeSingle(),

    database
      .from("outreach_communications")
      .select("id", {
        count: "exact",
        head: true,
      })
      .not("healthcare_referral_id", "is", null)
      .eq("direction", "outbound"),

    database
      .from("outreach_communications")
      .select("id", {
        count: "exact",
        head: true,
      })
      .not("healthcare_referral_id", "is", null)
      .eq("direction", "inbound"),

    database
      .from("outreach_communications")
      .select(
        "id, healthcare_referral_id, direction, subject, occurred_at",
        { count: "exact" }
      )
      .not("healthcare_referral_id", "is", null)
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1000),
  ]);

  if (referralResult.error) {
    throw new Error(
      "Unable to load healthcare referrals."
    );
  }

  const referrals = (
    referralResult.data ?? []
  ) as ReferralWithTimestamps[];

  const communicationHistoryAvailable = !historyResult.error;

  const communications = (communicationHistoryAvailable
    ? historyResult.data ?? []
    : []) as HealthcareCommunication[];

  const communicationHistoryLimited =
    communicationHistoryAvailable &&
    (historyResult.count ?? communications.length) >
      communications.length;

  const directoryLimited =
    (referralResult.count ?? referrals.length) >
    referrals.length;

  const connection = connectionResult.data;
  const sync = syncResult.data;

  const connectionUnavailable =
    Boolean(connectionResult.error);

  const syncUnavailable =
    Boolean(syncResult.error) || !sync;

  const today = getAdelaideDate();

  const awaitingOutreach = referrals.filter(
    (referral) =>
      referral.status === "Not contacted"
  ).length;

  const contacted = referrals.filter(
    (referral) =>
      referral.last_contacted_at !== null ||
      [
        "Emailed",
        "Responded",
        "Interested",
        "Sharing resources",
      ].includes(referral.status)
  ).length;

  const responded = referrals.filter(
    (referral) =>
      referral.last_response_at !== null ||
      [
        "Responded",
        "Interested",
        "Sharing resources",
      ].includes(referral.status)
  ).length;

  const interested = referrals.filter(
    (referral) =>
      referral.status === "Interested"
  ).length;

  const sharingResources = referrals.filter(
    (referral) =>
      referral.status === "Sharing resources"
  ).length;

  const declined = referrals.filter(
    (referral) =>
      referral.status === "Declined"
  ).length;

  const activeFollowUps = referrals.filter(
    (referral) =>
      Boolean(referral.follow_up_at) &&
      referral.status !== "Declined"
  );

  const followUpsDue = activeFollowUps.filter(
    (referral) =>
      referral.follow_up_at !== null &&
      referral.follow_up_at.slice(0, 10) <= today
  ).length;

  const followUpsScheduled = activeFollowUps.filter(
    (referral) =>
      referral.follow_up_at !== null &&
      referral.follow_up_at.slice(0, 10) > today
  ).length;

  const lastSuccessTime = sync?.last_success_at
    ? Date.parse(sync.last_success_at)
    : null;

  const minutesSinceSuccess =
    lastSuccessTime !== null &&
    Number.isFinite(lastSuccessTime)
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - lastSuccessTime) / 60_000
          )
        )
      : null;

  const activeLease =
    Boolean(sync?.lease_expires_at) &&
    Date.parse(sync?.lease_expires_at ?? "") >
      Date.now();

  let syncLabel = "Unavailable";
  let syncClass =
    "bg-[#F4F0E5] text-[#52645A]";

  if (!syncUnavailable && sync) {
    if (!sync.enabled) {
      syncLabel = "Disabled";
    } else if (sync.last_status === "failed") {
      syncLabel = "Attention required";
      syncClass = "bg-red-50 text-red-700";
    } else if (
      sync.last_status === "running" &&
      activeLease
    ) {
      syncLabel = "Synchronising";
      syncClass = "bg-amber-50 text-amber-800";
    } else if (
      sync.last_status === "running" &&
      !activeLease
    ) {
      syncLabel = "Interrupted";
      syncClass = "bg-red-50 text-red-700";
    } else if (minutesSinceSuccess === null) {
      syncLabel = "Awaiting first sync";
      syncClass = "bg-amber-50 text-amber-800";
    } else if (minutesSinceSuccess > 45) {
      syncLabel = "Sync overdue";
      syncClass = "bg-amber-50 text-amber-800";
    } else {
      syncLabel = "Up to date";
      syncClass = "bg-[#E8EBDD] text-[#173A2C]";
    }
  }

  const stats = [
    {
      label: "Total contacts",
      value:
        referralResult.count ?? referrals.length,
      description: "Healthcare directory",
    },
    {
      label: "Awaiting outreach",
      value: awaitingOutreach,
      description: "Not contacted",
    },
    {
      label: "Contacted",
      value: contacted,
      description: "Recorded outreach or relationship status",
    },
    {
      label: "Responded",
      value: responded,
      description: "Recorded response or positive relationship status",
    },
    {
      label: "Interested",
      value: interested,
      description: "Potential referral partners",
    },
    {
      label: "Sharing resources",
      value: sharingResources,
      description: "Active referral relationships",
    },
    {
      label: "Follow-ups due",
      value: followUpsDue,
      description: "Today or overdue",
    },
    {
      label: "Follow-ups scheduled",
      value: followUpsScheduled,
      description: "Upcoming dates",
    },
  ];

  return (
    <main className="min-h-screen bg-[#F4F0E5] px-5 py-10 text-[#173A2C] md:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-bold uppercase tracking-widest text-[#C96632]">
          The Dad Club / Administration
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight">
          Healthcare Referrals
        </h1>

        <p className="mt-4 max-w-2xl leading-relaxed text-[#52645A]">
          Manage professional outreach to healthcare providers
          supporting expectant and new fathers. Send emails
          through Outlook and track correspondence and referral
          relationships here.
        </p>

        {directoryLimited && (
          <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            The directory currently displays the first 500
            contacts. Contact-based statistics, other than the
            total contact count, reflect those displayed records.
          </p>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-[#173A2C]/15 bg-[#FBF8F0] p-5"
            >
              <p className="text-sm font-semibold">
                {stat.label}
              </p>

              <p className="mt-3 text-4xl font-black">
                {stat.value}
              </p>

              <p className="mt-2 text-xs leading-relaxed text-[#52645A]">
                {stat.description}
              </p>
            </div>
          ))}
        </div>

        <section className="mt-8 rounded-2xl border border-[#173A2C]/15 bg-[#FBF8F0] p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">
                Outlook Synchronisation
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-[#52645A]">
                Read-only correspondence tracking for healthcare
                and venue outreach.
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${syncClass}`}
            >
              {syncLabel}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-[#173A2C]/10 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#52645A]">
                Microsoft connection
              </p>

              <p className="mt-2 text-lg font-bold">
                {connectionUnavailable
                  ? "Unavailable"
                  : connection
                    ? "Connection saved"
                    : "Not connected"}
              </p>

              <p className="mt-1 break-all text-xs text-[#52645A]">
                {MAILBOX}
              </p>
            </div>

            <div className="rounded-xl border border-[#173A2C]/10 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#52645A]">
                Last successful sync
              </p>

              <p className="mt-2 text-lg font-bold">
                {syncUnavailable
                  ? "Unavailable"
                  : formatDateTime(sync?.last_success_at)}
              </p>

              {minutesSinceSuccess !== null && (
                <p className="mt-1 text-xs text-[#52645A]">
                  {minutesSinceSuccess < 1
                    ? "Less than a minute ago"
                    : `${minutesSinceSuccess} minutes ago`}
                </p>
              )}
            </div>

            <div className="rounded-xl border border-[#173A2C]/10 bg-white p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-[#52645A]">
                Synchronisation failures
              </p>

              <p className="mt-2 text-lg font-bold">
                {syncUnavailable
                  ? "Unavailable"
                  : sync?.consecutive_failures ?? 0}
              </p>

              <p className="mt-1 text-xs text-[#52645A]">
                Consecutive unsuccessful runs
              </p>
            </div>
          </div>

          {sync?.last_status === "failed" && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p className="font-bold">
                The latest synchronisation attempt failed.
              </p>

              <p className="mt-2">
                Last failure:{" "}
                {formatDateTime(sync.last_failure_at)}
              </p>

              <p className="mt-1 break-all text-xs">
                Error code:{" "}
                {sync.last_error_code ?? "unknown"}
              </p>
            </div>
          )}

          {syncLabel === "Sync overdue" && (
            <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No successful synchronisation has been recorded
              in the past 45 minutes. Check the scheduled job
              and Microsoft connection.
            </p>
          )}

          {syncLabel === "Interrupted" && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              The previous synchronisation did not finish
              before its execution lease expired.
            </p>
          )}

          {!syncUnavailable && !sync?.enabled && (
            <p className="mt-4 rounded-xl bg-[#F4F0E5] p-4 text-sm text-[#52645A]">
              Automatic correspondence tracking is currently
              disabled.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/api/auth/microsoft/connect"
              className="rounded-xl bg-[#173A2C] px-4 py-3 text-sm font-bold text-white hover:opacity-90"
            >
              {connection
                ? "Reconnect Microsoft"
                : "Connect Microsoft"}
            </a>

            <a
              href="https://outlook.office.com/mail/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-[#173A2C]/20 bg-white px-4 py-3 text-sm font-bold text-[#173A2C]"
            >
              Open Outlook
            </a>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-[#52645A]">
            A saved Microsoft connection does not guarantee
            that mailbox access is currently working.
            Synchronisation health is assessed separately.
            No outreach emails are sent by this dashboard.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-[#173A2C]/15 bg-[#FBF8F0] p-6">
          <h2 className="text-xl font-black">
            Communication Activity
          </h2>

          <p className="mt-2 text-sm text-[#52645A]">
            Recorded healthcare correspondence and relationship
            outcomes.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              {
                label: "Outgoing emails recorded",
                value: outboundResult.error
                  ? "Unavailable"
                  : outboundResult.count ?? 0,
              },
              {
                label: "Incoming replies recorded",
                value: inboundResult.error
                  ? "Unavailable"
                  : inboundResult.count ?? 0,
              },
              {
                label: "Declined contacts",
                value: declined,
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-[#173A2C]/10 bg-white p-4"
              >
                <p className="text-sm font-semibold text-[#52645A]">
                  {stat.label}
                </p>

                <p className="mt-2 text-2xl font-black">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <AddContactForm />

        <HealthcareDirectory
          referrals={referrals}
          communications={communications}
          communicationHistoryAvailable={communicationHistoryAvailable}
          communicationHistoryLimited={communicationHistoryLimited}
        />

        <p className="mt-8 text-xs text-[#52645A]">
          Signed in as {user.email}
        </p>
      </div>
    </main>
  );
}

export default function HealthcarePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F4F0E5] px-6 py-16 text-[#173A2C]">
          <p className="text-lg font-bold">
            Loading healthcare referrals…
          </p>
        </main>
      }
    >
      <HealthcareContent />
    </Suspense>
  );
}
