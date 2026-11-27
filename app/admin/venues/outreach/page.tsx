import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Temporal } from "@js-temporal/polyfill";

import { requireAdmin } from "../../../../lib/admin";

import {
  isActiveVenueFollowUp,
  type VenueOutreachContact,
  type VenueOutreachCommunication,
} from "../../../../lib/venueOutreach";

import { AddVenueContactForm } from "./VenueContactForms";
import VenueOutreachDirectory from "./VenueOutreachDirectory";

export const metadata: Metadata = {
  title: "Venue Outreach | The Dad Club Admin",
  robots: {
    index: false,
    follow: false,
  },
};

const MAILBOX = "hello@thedadclub.com.au";
const TIME_ZONE = "Australia/Adelaide";

function formatDateTime(
  value: string | null | undefined
): string {
  if (!value) return "Never";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-AU", {
    timeZone: TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

async function VenueOutreachContent() {
  const { user, database } = await requireAdmin();

  const [
    contactResult,
    historyResult,
    syncResult,
    connectionResult,
    outboundResult,
    inboundResult,
  ] = await Promise.all([
    database
      .from("venue_outreach_contacts")
      .select(
        "id,venue_name,contact_name,email,phone,website,suburb,state,priority,status,notes,last_contacted_at,last_response_at,follow_up_at,venue_partner_id,created_at,updated_at",
        { count: "exact" }
      )
      .order("venue_name", { ascending: true })
      .order("id", { ascending: true })
      .limit(500),

    database
      .from("outreach_communications")
      .select(
        "id,venue_outreach_contact_id,direction,subject,occurred_at",
        { count: "exact" }
      )
      .not("venue_outreach_contact_id", "is", null)
      .order("occurred_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(1000),

    database
      .from("outreach_sync_settings")
      .select(
        "enabled,last_status,last_success_at,last_failure_at,last_error_code,consecutive_failures,lease_expires_at"
      )
      .eq("id", 1)
      .maybeSingle(),

    database
      .from("microsoft_connections")
      .select("mailbox_email")
      .eq("mailbox_email", MAILBOX)
      .maybeSingle(),

    database
      .from("outreach_communications")
      .select("id", {
        count: "exact",
        head: true,
      })
      .not("venue_outreach_contact_id", "is", null)
      .eq("direction", "outbound"),

    database
      .from("outreach_communications")
      .select("id", {
        count: "exact",
        head: true,
      })
      .not("venue_outreach_contact_id", "is", null)
      .eq("direction", "inbound"),
  ]);

  if (contactResult.error) {
    throw new Error(
      "Unable to load venue outreach contacts."
    );
  }

  const contacts = (
    contactResult.data ?? []
  ) as VenueOutreachContact[];

  const historyAvailable = !historyResult.error;

  const communications = (
    historyAvailable
      ? historyResult.data ?? []
      : []
  ) as VenueOutreachCommunication[];

  const historyLimited =
    historyAvailable &&
    (historyResult.count ?? communications.length) >
      communications.length;

  const directoryLimited =
    (contactResult.count ?? contacts.length) >
    contacts.length;

  const sync = syncResult.data;
  const connection = connectionResult.data;

  const tomorrowStart = Temporal.Now
    .plainDateISO(TIME_ZONE)
    .add({ days: 1 })
    .toZonedDateTime({
      timeZone: TIME_ZONE,
      plainTime: "00:00",
    })
    .toInstant()
    .epochMilliseconds;

  const awaitingOutreach = contacts.filter(
    (contact) => contact.status === "Not contacted"
  ).length;

  const contacted = contacts.filter(
    (contact) =>
      contact.last_contacted_at !== null ||
      [
        "Emailed",
        "Responded",
        "Interested",
        "Confirmed",
      ].includes(contact.status)
  ).length;

  const responded = contacts.filter(
    (contact) =>
      contact.last_response_at !== null ||
      [
        "Responded",
        "Interested",
        "Confirmed",
      ].includes(contact.status)
  ).length;

  const interested = contacts.filter(
    (contact) => contact.status === "Interested"
  ).length;

  const confirmed = contacts.filter(
    (contact) => contact.status === "Confirmed"
  ).length;

  const declined = contacts.filter(
    (contact) => contact.status === "Declined"
  ).length;

  const activeFollowUps = contacts.filter(
    (contact) =>
      contact.follow_up_at !== null &&
      isActiveVenueFollowUp(contact.status)
  );

  const followUpsDue = activeFollowUps.filter(
    (contact) =>
      Date.parse(contact.follow_up_at ?? "") <
      tomorrowStart
  ).length;

  const followUpsScheduled = activeFollowUps.filter(
    (contact) =>
      Date.parse(contact.follow_up_at ?? "") >=
      tomorrowStart
  ).length;

  const stats = [
    {
      label: "Total venue contacts",
      value: contactResult.count ?? contacts.length,
      description: "Outreach directory",
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
      description: "Recorded replies or positive relationship status",
    },
    {
      label: "Interested",
      value: interested,
      description: "Potential venue partners",
    },
    {
      label: "Confirmed",
      value: confirmed,
      description: "Confirmed outreach relationships",
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

  const lastSuccessTime = sync?.last_success_at
    ? Date.parse(sync.last_success_at)
    : NaN;

  const minutesSinceSuccess =
    Number.isFinite(lastSuccessTime)
      ? Math.max(
          0,
          Math.floor(
            (Date.now() - lastSuccessTime) / 60_000
          )
        )
      : null;

  const activeLease =
    Date.parse(sync?.lease_expires_at ?? "") >
    Date.now();

  let syncLabel = "Unavailable";
  let syncClass = "bg-[#F4F0E5] text-[#52645A]";

  if (!syncResult.error && sync) {
    if (!sync.enabled) {
      syncLabel = "Disabled";
    } else if (sync.last_status === "failed") {
      syncLabel = "Attention required";
      syncClass = "bg-red-50 text-red-700";
    } else if (sync.last_status === "running") {
      syncLabel = activeLease
        ? "Synchronising"
        : "Interrupted";

      syncClass = activeLease
        ? "bg-amber-50 text-amber-800"
        : "bg-red-50 text-red-700";
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

  return (
    <main className="min-h-screen bg-[#F4F0E5] px-5 py-10 text-[#173A2C] md:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-bold uppercase tracking-widest text-[#C96632]">
          The Dad Club / Administration
        </p>

        <h1 className="mt-3 text-4xl font-black tracking-tight">
          Venue Outreach
        </h1>

        <p className="mt-4 max-w-2xl leading-relaxed text-[#52645A]">
          Manage proactive venue recruitment, partnership
          discussions and correspondence. Send emails
          through Outlook and track relationships here.
        </p>

        <nav
          aria-label="Venue management"
          className="mt-6 flex flex-wrap gap-3"
        >
          <Link
            href="/admin/venues/outreach"
            aria-current="page"
            className="rounded-full bg-[#173A2C] px-5 py-3 text-sm font-bold text-white"
          >
            Venue Outreach
          </Link>

          <Link
            href="/admin/venues"
            prefetch={false}
            className="rounded-full border border-[#173A2C]/20 bg-white px-5 py-3 text-sm font-bold"
          >
            Venue Enquiries
          </Link>

          <Link
            href="/venues"
            prefetch={false}
            className="rounded-full px-5 py-3 text-sm font-bold underline underline-offset-4"
          >
            Public venue page
          </Link>
        </nav>

        {directoryLimited && (
          <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            The directory displays the first 500 contacts.
            Contact-based statistics, except the total
            contact count, reflect those displayed records.
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

              <p className="mt-2 text-sm text-[#52645A]">
                Shared read-only correspondence tracking
                for healthcare and venue outreach.
              </p>
            </div>

            <span
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${syncClass}`}
            >
              {syncLabel}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                label: "Microsoft connection",
                value: connectionResult.error
                  ? "Unavailable"
                  : connection
                    ? "Connection saved"
                    : "Not connected",
                description: MAILBOX,
              },
              {
                label: "Last successful sync",
                value: syncResult.error || !sync
                  ? "Unavailable"
                  : formatDateTime(sync.last_success_at),
                description:
                  minutesSinceSuccess === null
                    ? "Adelaide time"
                    : `${minutesSinceSuccess} minutes ago`,
              },
              {
                label: "Consecutive failures",
                value: syncResult.error || !sync
                  ? "Unavailable"
                  : sync.consecutive_failures,
                description: "Unsuccessful sync attempts",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-[#173A2C]/10 bg-white p-4"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-[#52645A]">
                  {item.label}
                </p>

                <p className="mt-2 text-lg font-bold">
                  {item.value}
                </p>

                <p className="mt-1 break-all text-xs text-[#52645A]">
                  {item.description}
                </p>
              </div>
            ))}
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
              No successful synchronisation has been
              recorded in the past 45 minutes.
              Check the scheduled job and Microsoft connection.
            </p>
          )}

          {syncLabel === "Interrupted" && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              The previous execution did not finish
              before its lease expired.
            </p>
          )}

          {syncLabel === "Disabled" && (
            <p className="mt-4 rounded-xl bg-[#F4F0E5] p-4 text-sm">
              Automatic correspondence tracking is disabled.
            </p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/admin/healthcare"
              prefetch={false}
              className="rounded-xl bg-[#173A2C] px-4 py-3 text-sm font-bold text-white"
            >
              Manage Microsoft connection
            </Link>

            <a
              href="https://outlook.office.com/mail/"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-[#173A2C]/20 bg-white px-4 py-3 text-sm font-bold"
            >
              Open Outlook
            </a>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-[#52645A]">
            A saved Microsoft connection does not guarantee
            successful mailbox access. Synchronisation
            health is assessed separately.
            No outreach emails are sent by this dashboard.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-[#173A2C]/15 bg-[#FBF8F0] p-6">
          <h2 className="text-xl font-black">
            Communication Activity
          </h2>

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

        <AddVenueContactForm />

        <VenueOutreachDirectory
          contacts={contacts}
          communications={communications}
          historyAvailable={historyAvailable}
          historyLimited={historyLimited}
        />

        <p className="mt-8 text-xs text-[#52645A]">
          Signed in as {user.email}
        </p>
      </div>
    </main>
  );
}

export default function VenueOutreachPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F4F0E5] px-6 py-16 text-[#173A2C]">
          <p role="status" className="text-lg font-bold">
            Loading venue outreach…
          </p>
        </main>
      }
    >
      <VenueOutreachContent />
    </Suspense>
  );
}
