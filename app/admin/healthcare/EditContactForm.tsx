
"use client";

import { useState, useTransition } from "react";
import {
  updateHealthcareContact,
  type NewHealthcareContact,
} from "./actions";

type Props = {
  referralId: string;
  initialContact: NewHealthcareContact;
};

const categories = [
  "GP",
  "Midwife",
  "Psychologist",
  "Obstetrician",
  "Hospital",
  "Parenting service",
  "Mental health service",
  "Allied health",
  "Other",
];

export default function EditContactForm({
  referralId,
  initialContact,
}: Props) {
  const [contact, setContact] = useState<NewHealthcareContact>(
    initialContact
  );

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function updateField(
    field: keyof NewHealthcareContact,
    value: string
  ) {
    setContact((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setMessage("");
    setError("");

    startTransition(async () => {
      try {
        await updateHealthcareContact(referralId, contact);
        setMessage("Contact details saved successfully.");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to save contact details."
        );
      }
    });
  }

  return (
    <div className="mt-5 border-t border-[#173A2C]/10 pt-5">
      <details>
        <summary className="cursor-pointer text-sm font-bold text-[#173A2C]">
          Edit contact details
        </summary>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            {[
              {
                field: "organisation_name",
                label: "Organisation name",
                required: true,
              },
              {
                field: "contact_name",
                label: "Contact name",
              },
              {
                field: "email",
                label: "Email address",
              },
              {
                field: "phone",
                label: "Phone",
              },
              {
                field: "website",
                label: "Website",
              },
              {
                field: "suburb",
                label: "Suburb / region",
              },
            ].map((item) => (
              <div key={item.field}>
                <label
                  htmlFor={`${item.field}-${referralId}`}
                  className="block text-sm font-bold"
                >
                  {item.label}
                </label>

                <input
                  id={`${item.field}-${referralId}`}
                  type={
                    item.field === "email"
                      ? "email"
                      : item.field === "website"
                        ? "url"
                        : "text"
                  }
                  required={item.required}
                  value={
                    contact[
                      item.field as keyof NewHealthcareContact
                    ]
                  }
                  onChange={(event) =>
                    updateField(
                      item.field as keyof NewHealthcareContact,
                      event.target.value
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-[#173A2C]/20 bg-white px-4 py-3 text-sm"
                />
              </div>
            ))}

            <div>
              <label
                htmlFor={`category-${referralId}`}
                className="block text-sm font-bold"
              >
                Category
              </label>

              <select
                id={`category-${referralId}`}
                value={contact.category}
                onChange={(event) =>
                  updateField("category", event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-[#173A2C]/20 bg-white px-4 py-3 text-sm"
              >
                {Array.from(
                  new Set([contact.category, ...categories])
                ).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor={`priority-${referralId}`}
                className="block text-sm font-bold"
              >
                Priority
              </label>

              <select
                id={`priority-${referralId}`}
                value={contact.priority}
                onChange={(event) =>
                  updateField("priority", event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-[#173A2C]/20 bg-white px-4 py-3 text-sm"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-[#173A2C] px-6 py-3 text-sm font-bold text-[#FBF8F0] transition hover:bg-[#24533F] disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save contact details"}
          </button>

          {message && (
            <p role="status" className="text-sm font-semibold text-green-800">
              {message}
            </p>
          )}

          {error && (
            <p role="alert" className="text-sm font-semibold text-red-700">
              {error}
            </p>
          )}
        </form>
      </details>
    </div>
  );
}
