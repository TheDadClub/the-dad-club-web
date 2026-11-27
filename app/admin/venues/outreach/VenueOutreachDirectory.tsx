"use client";

import { useMemo, useState } from "react";

import {
  VENUE_OUTREACH_STATUSES,
  VENUE_OUTREACH_PRIORITIES,
  isActiveVenueFollowUp,
  type VenueOutreachContact,
  type VenueOutreachCommunication,
} from "../../../../lib/venueOutreach";

import {
  VenueStatusForm,
  EditVenueContactForm,
  VenueNotesForm,
} from "./VenueContactForms";

import VenueEmailComposer from "./VenueEmailComposer";

type Props = {
  contacts: VenueOutreachContact[];
  communications: VenueOutreachCommunication[];
  historyAvailable: boolean;
  historyLimited: boolean;
};

function formatDateTime(value: string | null) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Adelaide",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Adelaide",
    dateStyle: "medium",
  }).format(date);
}

function dateKey(value: Date) {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Adelaide",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(value);

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}`;
}

function followUpStatus(
  contact: VenueOutreachContact,
  today: string
) {
  if (
    !contact.follow_up_at ||
    !isActiveVenueFollowUp(contact.status)
  ) {
    return "None";
  }

  const date = new Date(contact.follow_up_at);

  if (!Number.isFinite(date.getTime())) {
    return "None";
  }

  const key = dateKey(date);

  if (key < today) return "Overdue";
  if (key === today) return "Due today";

  return "Scheduled";
}

const inputClass =
  "mt-2 w-full rounded-xl border border-[#173A2C]/20 bg-white px-4 py-3 text-sm text-[#173A2C]";

export default function VenueOutreachDirectory({
  contacts,
  communications,
  historyAvailable,
  historyLimited,
}: Props) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [priority, setPriority] = useState("All");
  const [state, setState] = useState("All");
  const [followUp, setFollowUp] = useState("All");

  const today = dateKey(new Date());

  const states = useMemo(
    () =>
      Array.from(
        new Set(contacts.map((contact) => contact.state))
      ).sort(),
    [contacts]
  );

  const historyByContact = useMemo(() => {
    const grouped = new Map<
      string,
      VenueOutreachCommunication[]
    >();

    for (const communication of communications) {
      const existing =
        grouped.get(
          communication.venue_outreach_contact_id
        ) ?? [];

      existing.push(communication);

      grouped.set(
        communication.venue_outreach_contact_id,
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

    return contacts.filter((contact) => {
      const searchable = [
        contact.venue_name,
        contact.contact_name,
        contact.email,
        contact.phone,
        contact.suburb,
        contact.state,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (status === "All" || contact.status === status) &&
        (priority === "All" || contact.priority === priority) &&
        (state === "All" || contact.state === state) &&
        (
          followUp === "All" ||
          followUpStatus(contact, today) === followUp
        )
      );
    });
  }, [
    contacts,
    search,
    status,
    priority,
    state,
    followUp,
    today,
  ]);

  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-2xl font-black">
          Venue outreach contacts
        </h2>

        <span className="rounded-full bg-[#E8EBDD] px-4 py-2 text-sm font-bold">
          {filtered.length} of {contacts.length} venues
        </span>
      </div>

      <p className="mt-3 text-sm text-[#52645A]">
        Manage proactive venue outreach, partnership
        discussions and follow-ups.
      </p>

      <div className="mt-6 rounded-2xl border border-[#173A2C]/15 bg-[#FBF8F0] p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block text-sm font-bold">
            Search
            <input
              type="search"
              placeholder="Venue, email, suburb..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              className={inputClass}
            />
          </label>

          <label className="block text-sm font-bold">
            Status
            <select
              value={status}
              onChange={(event) =>
                setStatus(event.target.value)
              }
              className={inputClass}
            >
              <option value="All">All statuses</option>
              {VENUE_OUTREACH_STATUSES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-bold">
            Priority
            <select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value)
              }
              className={inputClass}
            >
              <option value="All">All priorities</option>
              {VENUE_OUTREACH_PRIORITIES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-bold">
            State
            <select
              value={state}
              onChange={(event) =>
                setState(event.target.value)
              }
              className={inputClass}
            >
              <option value="All">All states</option>
              {states.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-bold">
            Follow-up
            <select
              value={followUp}
              onChange={(event) =>
                setFollowUp(event.target.value)
              }
              className={inputClass}
            >
              <option value="All">All follow-ups</option>
              <option value="Overdue">Overdue</option>
              <option value="Due today">Due today</option>
              <option value="Scheduled">Scheduled</option>
              <option value="None">No active follow-up</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          onClick={() => {
            setSearch("");
            setStatus("All");
            setPriority("All");
            setState("All");
            setFollowUp("All");
          }}
          className="mt-4 text-sm font-bold underline underline-offset-4"
        >
          Clear filters
        </button>
      </div>

      <div className="mt-6 space-y-4">
        {filtered.length === 0 && (
          <p className="rounded-2xl bg-[#E8EBDD] p-6">
            No venue contacts match your search.
          </p>
        )}

        {filtered.map((contact) => {
          const history =
            historyByContact.get(contact.id) ?? [];

          const followUpState =
            followUpStatus(contact, today);

          const due =
            followUpState === "Overdue" ||
            followUpState === "Due today";

          return (
            <article
              key={contact.id}
              className="rounded-2xl border border-[#173A2C]/15 bg-[#FBF8F0] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="break-words text-xl font-black">
                    {contact.venue_name}
                  </h3>

                  <p className="mt-1 text-sm text-[#52645A]">
                    {[contact.suburb, contact.state]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#E8EBDD] px-3 py-1 text-xs font-bold">
                      {contact.status}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        contact.priority === "High"
                          ? "bg-amber-50 text-amber-800"
                          : "bg-[#F4F0E5] text-[#52645A]"
                      }`}
                    >
                      {contact.priority} priority
                    </span>

                    {due && (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                        {followUpState}
                      </span>
                    )}
                  </div>
                </div>

                <VenueStatusForm contact={contact} />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#173A2C]/10 bg-white p-3">
                  <p className="text-xs font-bold text-[#52645A]">
                    Last contacted
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    {formatDateTime(contact.last_contacted_at)}
                  </p>
                </div>

                <div className="rounded-xl border border-[#173A2C]/10 bg-white p-3">
                  <p className="text-xs font-bold text-[#52645A]">
                    Last response
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    {formatDateTime(contact.last_response_at)}
                  </p>
                </div>

                <div
                  className={`rounded-xl border p-3 ${
                    due
                      ? "border-red-200 bg-red-50"
                      : "border-[#173A2C]/10 bg-white"
                  }`}
                >
                  <p className="text-xs font-bold text-[#52645A]">
                    Next follow-up
                  </p>

                  <p className="mt-2 text-sm font-semibold">
                    {formatDate(contact.follow_up_at)}
                  </p>

                  {contact.follow_up_at && (
                    <p className="mt-1 text-xs text-[#52645A]">
                      {isActiveVenueFollowUp(contact.status)
                        ? followUpState
                        : "Inactive follow-up"}
                    </p>
                  )}
                </div>
              </div>

              <details className="mt-4 border-t border-[#173A2C]/10 pt-4">
                <summary className="cursor-pointer text-sm font-bold">
                  View contact details and history
                </summary>

                <div className="mt-5 space-y-4">
                  <div className="grid gap-4 text-sm sm:grid-cols-2">
                    {[
                      [
                        "Contact name",
                        contact.contact_name,
                      ],
                      ["Email", contact.email],
                      ["Phone", contact.phone],
                      ["Website", contact.website],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <p className="font-bold">
                          {label}
                        </p>

                        <p className="mt-1 break-all text-[#52645A]">
                          {value || "Not specified"}
                        </p>
                      </div>
                    ))}
                  </div>

                  <section className="rounded-xl border border-[#173A2C]/15 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-black">
                        Communication history
                      </h4>

                      {historyAvailable && (
                        <span className="rounded-full bg-[#E8EBDD] px-3 py-1 text-xs font-bold">
                          {history.length} loaded
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-[#52645A]">
                      Recorded Outlook correspondence.
                      Email bodies and attachments are
                      not stored here.
                    </p>

                    {!historyAvailable ? (
                      <p className="mt-4 rounded-lg bg-[#F4F0E5] p-3 text-sm">
                        Communication history is unavailable.
                      </p>
                    ) : (
                      <>
                        {historyLimited && (
                          <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                            Only a limited selection of recent
                            communications has been loaded.
                          </p>
                        )}

                        {history.length === 0 ? (
                          <p className="mt-4 rounded-lg bg-[#F4F0E5] p-3 text-sm">
                            {historyLimited
                              ? "No correspondence for this venue in the loaded history."
                              : "No synchronised correspondence recorded yet."}
                          </p>
                        ) : (
                          <div className="mt-4 divide-y divide-[#173A2C]/10">
                            {history.map((communication) => (
                              <div
                                key={communication.id}
                                className="py-3"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <span className="rounded-full bg-[#E8EBDD] px-3 py-1 text-xs font-bold">
                                    {communication.direction === "inbound"
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
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    <a
                      href="https://outlook.office.com/mail/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block text-xs font-bold underline underline-offset-4"
                    >
                      View correspondence in Outlook
                    </a>
                  </section>

                  {contact.venue_partner_id && (
                    <a
                      href={`/admin/venues#venue-${contact.venue_partner_id}`}
                      className="inline-block text-sm font-bold underline underline-offset-4"
                    >
                      Open linked partnership enquiry
                    </a>
                  )}

                  <VenueEmailComposer
                    contactId={contact.id}
                    recipientEmail={contact.email}
                    currentStatus={contact.status}
                  />

                  <EditVenueContactForm contact={contact} />

                  <VenueNotesForm contact={contact} />
                </div>
              </details>
            </article>
          );
        })}
      </div>
    </section>
  );
}
