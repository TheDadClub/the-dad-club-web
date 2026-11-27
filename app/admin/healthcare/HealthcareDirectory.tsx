
"use client";

import { useMemo, useState } from "react";
import StatusSelector from "./StatusSelector";
import NotesEditor from "./NotesEditor";
import EditContactForm from "./EditContactForm";
import DeleteContactButton from "./DeleteContactButton";
import HealthcareEmailComposer from "./HealthcareEmailComposer";

export type HealthcareReferral = {
  id: string;
  organisation_name: string;
  contact_name: string | null;
  category: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  suburb: string | null;
  state: string | null;
  priority: string;
  status: string;
  notes: string | null;
  follow_up_at: string | null;
  last_contacted_at: string | null;
  last_response_at: string | null;
};

export type HealthcareCommunication = {
  id: string;
  healthcare_referral_id: string;
  direction: "outbound" | "inbound";
  subject: string | null;
  occurred_at: string;
};

type Props = {
  referrals: HealthcareReferral[];
  communications?: HealthcareCommunication[];
  communicationHistoryAvailable?: boolean;
  communicationHistoryLimited?: boolean;
};

function formatDateTime(
  value: string | null
): string {
  if (!value) {
    return "Not recorded";
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

function formatFollowUpDate(
  value: string
): string {
  const date = new Date(
    `${value.slice(0, 10)}T12:00:00Z`
  );

  if (!Number.isFinite(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
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

function getFollowUpStatus(
  referral: HealthcareReferral,
  today: string
): string {
  if (
    !referral.follow_up_at ||
    referral.status === "Declined"
  ) {
    return "None";
  }

  const date = referral.follow_up_at.slice(0, 10);

  if (date < today) {
    return "Overdue";
  }

  if (date === today) {
    return "Due today";
  }

  return "Scheduled";
}

function getPriorityClass(
  priority: string
): string {
  switch (priority) {
    case "High":
      return "bg-amber-50 text-amber-800";
    case "Low":
      return "bg-[#F4F0E5] text-[#52645A]";
    default:
      return "bg-[#E8EBDD] text-[#173A2C]";
  }
}

export default function HealthcareDirectory({
  referrals,
  communications = [],
  communicationHistoryAvailable = false,
  communicationHistoryLimited = false,
}: Props) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [followUp, setFollowUp] = useState("All");

  const today = getAdelaideDate();

  const categories = useMemo(
    () =>
      Array.from(
        new Set(
          referrals.map(
            (referral) => referral.category
          )
        )
      ).sort(),
    [referrals]
  );

  const communicationsByContact = useMemo(() => {
    const grouped = new Map<
      string,
      HealthcareCommunication[]
    >();

    for (const communication of communications) {
      const existing =
        grouped.get(
          communication.healthcare_referral_id
        ) ?? [];

      existing.push(communication);

      grouped.set(
        communication.healthcare_referral_id,
        existing
      );
    }

    for (const history of grouped.values()) {
      history.sort(
        (a, b) =>
          Date.parse(b.occurred_at) -
          Date.parse(a.occurred_at)
      );
    }

    return grouped;
  }, [communications]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return referrals.filter((referral) => {
      const searchable = [
        referral.organisation_name,
        referral.contact_name,
        referral.email,
        referral.suburb,
        referral.category,
        referral.phone,
        referral.state,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const followUpStatus = getFollowUpStatus(
        referral,
        today
      );

      return (
        (!query || searchable.includes(query)) &&
        (
          category === "All" ||
          referral.category === category
        ) &&
        (
          status === "All" ||
          referral.status === status
        ) &&
        (
          priority === "All" ||
          referral.priority === priority
        ) &&
        (
          followUp === "All" ||
          followUpStatus === followUp
        )
      );
    });
  }, [
    referrals,
    search,
    category,
    status,
    priority,
    followUp,
    today,
  ]);

  const inputClass =
    "w-full rounded-xl border border-[#173A2C]/20 bg-white px-4 py-3 text-sm text-[#173A2C]";

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-black">
          Healthcare contacts
        </h2>

        <span className="rounded-full bg-[#E8EBDD] px-4 py-2 text-sm font-bold">
          {filtered.length} of {referrals.length} contacts
        </span>
      </div>

      <p className="mt-3 text-sm text-[#52645A]">
        Search and filter healthcare organisations.
        Manage relationship statuses, notes and follow-ups.
        Send correspondence through Outlook and track
        synchronised communication here.
      </p>

      <div className="mt-6 rounded-2xl border border-[#173A2C]/15 bg-[#FBF8F0] p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label
              htmlFor="healthcare-search"
              className="block text-sm font-bold"
            >
              Search
            </label>

            <input
              id="healthcare-search"
              type="search"
              placeholder="Organisation, email..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              className={`mt-2 ${inputClass}`}
            />
          </div>

          <div>
            <label
              htmlFor="healthcare-category"
              className="block text-sm font-bold"
            >
              Category
            </label>

            <select
              id="healthcare-category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
              className={`mt-2 ${inputClass}`}
            >
              <option value="All">
                All categories
              </option>

              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="healthcare-status"
              className="block text-sm font-bold"
            >
              Status
            </label>

            <select
              id="healthcare-status"
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className={`mt-2 ${inputClass}`}
            >
              <option value="All">
                All statuses
              </option>

              {[
                "Not contacted",
                "Emailed",
                "Responded",
                "Interested",
                "Sharing resources",
                "Declined",
              ].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="healthcare-priority"
              className="block text-sm font-bold"
            >
              Priority
            </label>

            <select
              id="healthcare-priority"
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value)
              }
              className={`mt-2 ${inputClass}`}
            >
              <option value="All">
                All priorities
              </option>

              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="healthcare-followup"
              className="block text-sm font-bold"
            >
              Follow-up
            </label>

            <select
              id="healthcare-followup"
              value={followUp}
              onChange={(event) =>
                setFollowUp(event.target.value)
              }
              className={`mt-2 ${inputClass}`}
            >
              <option value="All">
                All follow-ups
              </option>

              <option value="Overdue">
                Overdue
              </option>

              <option value="Due today">
                Due today
              </option>

              <option value="Scheduled">
                Scheduled
              </option>

              <option value="None">
                No active follow-up
              </option>
            </select>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setSearch("");
            setCategory("All");
            setStatus("All");
            setPriority("All");
            setFollowUp("All");
          }}
          className="mt-4 text-sm font-bold underline underline-offset-4"
        >
          Clear filters
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {filtered.length === 0 && (
          <div className="rounded-2xl bg-[#E8EBDD] p-6">
            No healthcare contacts match your search.
          </div>
        )}

        {filtered.map((referral) => {
          const history =
            communicationsByContact.get(
              referral.id
            ) ?? [];

          const followUpStatus =
            getFollowUpStatus(referral, today);

          const followUpDue =
            followUpStatus === "Overdue" ||
            followUpStatus === "Due today";

          return (
            <article
              key={referral.id}
              className="rounded-2xl border border-[#173A2C]/15 bg-[#FBF8F0] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="text-lg font-black">
                    {referral.organisation_name}
                  </h3>

                  <p className="mt-1 text-sm text-[#52645A]">
                    {referral.category}
                    {referral.suburb
                      ? ` · ${referral.suburb}`
                      : ""}
                    {referral.state
                      ? ` · ${referral.state}`
                      : ""}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${getPriorityClass(
                        referral.priority
                      )}`}
                    >
                      {referral.priority} priority
                    </span>

                    {followUpDue && (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                        {followUpStatus}
                      </span>
                    )}
                  </div>
                </div>

                <StatusSelector
                  referralId={referral.id}
                  currentStatus={referral.status}
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#173A2C]/10 bg-white p-3">
                  <p className="text-xs font-bold text-[#52645A]">
                    Last contacted
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    {formatDateTime(
                      referral.last_contacted_at
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-[#173A2C]/10 bg-white p-3">
                  <p className="text-xs font-bold text-[#52645A]">
                    Last response
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    {formatDateTime(
                      referral.last_response_at
                    )}
                  </p>
                </div>

                <div
                  className={`rounded-xl border p-3 ${
                    followUpDue
                      ? "border-red-200 bg-red-50"
                      : "border-[#173A2C]/10 bg-white"
                  }`}
                >
                  <p className="text-xs font-bold text-[#52645A]">
                    Next follow-up
                  </p>

                  <p
                    className={`mt-2 text-sm font-semibold ${
                      followUpDue
                        ? "text-red-700"
                        : "text-[#173A2C]"
                    }`}
                  >
                    {referral.follow_up_at
                      ? formatFollowUpDate(
                          referral.follow_up_at
                        )
                      : "Not scheduled"}
                  </p>

                  {referral.follow_up_at && (
                    <p className="mt-1 text-xs text-[#52645A]">
                      {referral.status === "Declined"
                        ? "Inactive — contact declined"
                        : followUpStatus}
                    </p>
                  )}
                </div>
              </div>

              <details className="mt-4 border-t border-[#173A2C]/10 pt-4">
                <summary className="cursor-pointer text-sm font-bold">
                  View contact details
                </summary>

                <div className="mt-5 space-y-4">
                  <div className="grid gap-4 text-sm sm:grid-cols-3">
                    <div>
                      <p className="font-bold">
                        Contact
                      </p>

                      <p className="mt-1 text-[#52645A]">
                        {referral.contact_name ||
                          "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="font-bold">
                        Email
                      </p>

                      <p className="mt-1 break-all text-[#52645A]">
                        {referral.email ||
                          "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="font-bold">
                        Phone
                      </p>

                      {referral.phone ? (
                        <a
                          href={`tel:${referral.phone}`}
                          className="mt-1 block text-[#52645A] underline underline-offset-4"
                        >
                          {referral.phone}
                        </a>
                      ) : (
                        <p className="mt-1 text-[#52645A]">
                          Not specified
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="font-bold">
                        Website
                      </p>

                      <p className="mt-1 break-all text-[#52645A]">
                        {referral.website ||
                          "Not specified"}
                      </p>
                    </div>

                    <div>
                      <p className="font-bold">
                        Priority
                      </p>

                      <p className="mt-1 text-[#52645A]">
                        {referral.priority}
                      </p>
                    </div>

                    <div>
                      <p className="font-bold">
                        Location
                      </p>

                      <p className="mt-1 text-[#52645A]">
                        {[
                          referral.suburb,
                          referral.state,
                        ]
                          .filter(Boolean)
                          .join(", ") ||
                          "Not specified"}
                      </p>
                    </div>
                  </div>

                  <section className="rounded-xl border border-[#173A2C]/15 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-black">
                        Communication history
                      </h4>

                      {communicationHistoryAvailable && (
                        <span className="rounded-full bg-[#E8EBDD] px-3 py-1 text-xs font-bold">
                          {history.length} loaded
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs leading-relaxed text-[#52645A]">
                      Recorded Outlook correspondence.
                      Email bodies and attachments are
                      not stored here.
                    </p>

                    {!communicationHistoryAvailable ? (
                      <p className="mt-4 rounded-lg bg-[#F4F0E5] p-3 text-sm text-[#52645A]">
                        Communication history is currently
                        unavailable.
                      </p>
                    ) : (
                      <>
                        {communicationHistoryLimited && (
                          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                            Only a limited selection of
                            recent communications has
                            been loaded.
                          </p>
                        )}

                        {history.length === 0 ? (
                          <p className="mt-4 rounded-lg bg-[#F4F0E5] p-3 text-sm text-[#52645A]">
                            {communicationHistoryLimited
                              ? "No communications for this contact in the loaded history."
                              : "No synchronised correspondence recorded yet."}
                          </p>
                        ) : (
                          <div className="mt-4 divide-y divide-[#173A2C]/10">
                            {history.map(
                              (communication) => (
                                <div
                                  key={communication.id}
                                  className="py-3"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span
                                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                                        communication.direction ===
                                        "inbound"
                                          ? "bg-[#E8EBDD] text-[#173A2C]"
                                          : "bg-[#F4F0E5] text-[#52645A]"
                                      }`}
                                    >
                                      {communication.direction ===
                                      "inbound"
                                        ? "Reply received"
                                        : "Email sent"}
                                    </span>

                                    <span className="text-xs text-[#52645A]">
                                      {formatDateTime(
                                        communication.occurred_at
                                      )}
                                    </span>
                                  </div>

                                  <p className="mt-2 break-words text-sm font-semibold">
                                    {communication.subject ||
                                      "(No subject)"}
                                  </p>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </>
                    )}

                    <a
                      href="https://outlook.office.com/mail/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block text-xs font-bold text-[#173A2C] underline underline-offset-4"
                    >
                      View correspondence in Outlook
                    </a>
                  </section>

                  <HealthcareEmailComposer
                    referralId={referral.id}
                    recipientEmail={referral.email}
                    currentStatus={referral.status}
                  />

                  <EditContactForm
                    referralId={referral.id}
                    initialContact={{
                      organisation_name:
                        referral.organisation_name,
                      contact_name:
                        referral.contact_name ?? "",
                      category: referral.category,
                      email: referral.email ?? "",
                      phone: referral.phone ?? "",
                      website: referral.website ?? "",
                      suburb: referral.suburb ?? "",
                      priority: referral.priority,
                      notes: referral.notes ?? "",
                    }}
                  />

                  <NotesEditor
                    referralId={referral.id}
                    initialNotes={referral.notes}
                    initialFollowUp={
                      referral.follow_up_at
                    }
                  />

                  <DeleteContactButton
                    referralId={referral.id}
                    organisationName={
                      referral.organisation_name
                    }
                  />
                </div>
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
