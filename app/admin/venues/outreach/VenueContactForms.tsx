"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  addVenueOutreachContact,
  updateVenueOutreachContact,
  updateVenueOutreachStatus,
  updateVenueOutreachNotes,
} from "./actions";

import {
  AUSTRALIAN_STATES,
  VENUE_OUTREACH_PRIORITIES,
  VENUE_OUTREACH_STATUSES,
  type VenueOutreachContact,
} from "../../../../lib/venueOutreach";

const inputClass =
  "mt-2 w-full rounded-xl border border-[#173A2C]/20 bg-white px-4 py-3 text-sm text-[#173A2C]";

const buttonClass =
  "rounded-xl bg-[#173A2C] px-5 py-3 text-sm font-bold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40";

type ActionResult = {
  success: boolean;
  message: string;
};

type FormAction = (
  formData: FormData
) => Promise<ActionResult>;

function useVenueForm(action: FormAction) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] =
    useState<ActionResult | null>(null);

  function submit(
    formData: FormData,
    onSuccess?: () => void
  ) {
    setResult(null);

    startTransition(async () => {
      try {
        const response = await action(formData);

        setResult(response);

        if (response.success) {
          onSuccess?.();
        }

        router.refresh();
      } catch {
        setResult({
          success: false,
          message:
            "Unable to save changes. Please refresh and review the record.",
        });
      }
    });
  }

  return {
    pending,
    result,
    submit,
  };
}

function FormResult({
  result,
}: {
  result: ActionResult | null;
}) {
  if (!result) return null;

  return (
    <p
      role={result.success ? "status" : "alert"}
      className={`mt-3 rounded-xl p-3 text-sm ${
        result.success
          ? "bg-[#E8EBDD] text-[#173A2C]"
          : "bg-red-50 text-red-700"
      }`}
    >
      {result.message}
    </p>
  );
}

function followUpDate(
  value: string | null
): string {
  if (!value) return "";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Adelaide",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

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

function ContactFields({
  contact,
}: {
  contact?: VenueOutreachContact;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="block text-sm font-bold">
        Venue name *
        <input
          name="venue_name"
          required
          maxLength={150}
          defaultValue={contact?.venue_name ?? ""}
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-bold">
        Contact name
        <input
          name="contact_name"
          maxLength={150}
          defaultValue={contact?.contact_name ?? ""}
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-bold">
        Email address *
        <input
          name="email"
          type="email"
          required
          maxLength={254}
          defaultValue={contact?.email ?? ""}
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-bold">
        Phone
        <input
          name="phone"
          type="tel"
          maxLength={50}
          defaultValue={contact?.phone ?? ""}
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-bold">
        Website
        <input
          name="website"
          maxLength={500}
          placeholder="https://"
          defaultValue={contact?.website ?? ""}
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-bold">
        Suburb
        <input
          name="suburb"
          maxLength={150}
          defaultValue={contact?.suburb ?? ""}
          className={inputClass}
        />
      </label>

      <label className="block text-sm font-bold">
        State
        <select
          name="state"
          required
          defaultValue={contact?.state ?? "SA"}
          className={inputClass}
        >
          {AUSTRALIAN_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-bold">
        Priority
        <select
          name="priority"
          required
          defaultValue={contact?.priority ?? "Medium"}
          className={inputClass}
        >
          {VENUE_OUTREACH_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

export function AddVenueContactForm() {
  const [open, setOpen] = useState(false);
  const [formVersion, setFormVersion] = useState(0);

  const { pending, result, submit } =
    useVenueForm(addVenueOutreachContact);

  return (
    <section className="mt-8 rounded-2xl border border-[#173A2C]/15 bg-[#FBF8F0] p-5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={buttonClass}
      >
        {open ? "Close form" : "+ Add venue contact"}
      </button>

      {open && (
        <form
          key={formVersion}
          action={(data) =>
            submit(data, () =>
              setFormVersion((value) => value + 1)
            )
          }
          className="mt-6 space-y-4"
        >
          <fieldset
            disabled={pending}
            className="space-y-4 disabled:opacity-60"
          >
            <ContactFields />

            <label className="block text-sm font-bold">
              Follow-up date
              <input
                type="date"
                name="follow_up_date"
                min="2000-01-01"
                max="2100-12-31"
                className={inputClass}
              />
            </label>

            <label className="block text-sm font-bold">
              Internal notes
              <textarea
                name="notes"
                rows={4}
                maxLength={5000}
                className={inputClass}
              />
            </label>

            <p className="text-xs text-[#52645A]">
              New venues start with a status of Not contacted.
              Adding a venue does not send an email.
            </p>

            <button
              type="submit"
              disabled={pending}
              className={buttonClass}
            >
              {pending ? "Saving..." : "Add venue"}
            </button>
          </fieldset>
        </form>
      )}

      <FormResult result={result} />
    </section>
  );
}

export function VenueStatusForm({
  contact,
}: {
  contact: VenueOutreachContact;
}) {
  const { pending, result, submit } =
    useVenueForm(updateVenueOutreachStatus);

  return (
    <div>
      <form
        key={contact.updated_at}
        action={(data) => submit(data)}
        className="flex flex-wrap items-end gap-2"
      >
        <input
          type="hidden"
          name="id"
          value={contact.id}
        />

        <input
          type="hidden"
          name="updated_at"
          value={contact.updated_at}
        />

        <label className="block text-xs font-bold">
          Relationship status
          <select
            name="status"
            defaultValue={contact.status}
            disabled={pending}
            className={inputClass}
          >
            {VENUE_OUTREACH_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={pending}
          className={buttonClass}
        >
          {pending ? "Saving..." : "Save status"}
        </button>
      </form>

      <FormResult result={result} />
    </div>
  );
}

export function EditVenueContactForm({
  contact,
}: {
  contact: VenueOutreachContact;
}) {
  const { pending, result, submit } =
    useVenueForm(updateVenueOutreachContact);

  return (
    <details className="rounded-xl border border-[#173A2C]/15 bg-white p-4">
      <summary className="cursor-pointer text-sm font-bold">
        Edit contact details
      </summary>

      <form
        key={contact.updated_at}
        action={(data) => submit(data)}
        className="mt-5 space-y-4"
      >
        <input
          type="hidden"
          name="id"
          value={contact.id}
        />

        <input
          type="hidden"
          name="updated_at"
          value={contact.updated_at}
        />

        <fieldset
          disabled={pending}
          className="space-y-4 disabled:opacity-60"
        >
          <ContactFields contact={contact} />

          <p className="text-xs text-[#52645A]">
            Changing the email address may affect future
            automatic correspondence matching.
          </p>

          <button
            type="submit"
            disabled={pending}
            className={buttonClass}
          >
            {pending ? "Saving..." : "Save contact details"}
          </button>
        </fieldset>
      </form>

      <FormResult result={result} />
    </details>
  );
}

export function VenueNotesForm({
  contact,
}: {
  contact: VenueOutreachContact;
}) {
  const { pending, result, submit } =
    useVenueForm(updateVenueOutreachNotes);

  return (
    <section className="rounded-xl border border-[#173A2C]/15 bg-white p-4">
      <h4 className="font-black">
        Notes and follow-up
      </h4>

      <form
        key={contact.updated_at}
        action={(data) => submit(data)}
        className="mt-4 space-y-4"
      >
        <input
          type="hidden"
          name="id"
          value={contact.id}
        />

        <input
          type="hidden"
          name="updated_at"
          value={contact.updated_at}
        />

        <fieldset
          disabled={pending}
          className="space-y-4 disabled:opacity-60"
        >
          <label className="block text-sm font-bold">
            Internal notes
            <textarea
              name="notes"
              rows={5}
              maxLength={5000}
              defaultValue={contact.notes ?? ""}
              placeholder="Partnership discussions, room arrangements or next steps."
              className={inputClass}
            />
          </label>

          <label className="block text-sm font-bold">
            Next follow-up date
            <input
              name="follow_up_date"
              type="date"
              min="2000-01-01"
              max="2100-12-31"
              defaultValue={followUpDate(
                contact.follow_up_at
              )}
              className={inputClass}
            />
          </label>

          <p className="text-xs leading-relaxed text-[#52645A]">
            Follow-up dates use Adelaide time.
            Clear the date when no further follow-up is needed.
            No automatic reminder or email is sent.
          </p>

          <button
            type="submit"
            disabled={pending}
            className={buttonClass}
          >
            {pending
              ? "Saving..."
              : "Save notes and follow-up"}
          </button>
        </fieldset>
      </form>

      <FormResult result={result} />
    </section>
  );
}
