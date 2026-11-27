
"use client";

import { useState, useTransition } from "react";
import {
  createHealthcareContact,
  type NewHealthcareContact,
} from "./actions";

const initialContact: NewHealthcareContact = {
  organisation_name: "",
  contact_name: "",
  category: "GP",
  email: "",
  phone: "",
  website: "",
  suburb: "",
  priority: "Medium",
  notes: "",
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

export default function AddContactForm() {
  const [contact, setContact] =
    useState<NewHealthcareContact>({ ...initialContact });

  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [formKey, setFormKey] = useState(0);

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
        await createHealthcareContact(contact);

        setContact({ ...initialContact });
        setFormKey((previous) => previous + 1);
        setMessage("Healthcare contact added successfully.");
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to add contact. Please try again."
        );
      }
    });
  }

  return (
    <section className="mt-10 rounded-[24px] border border-[#173A2C]/15 bg-[#FBF8F0] p-6 md:p-8">
      <details>
        <summary className="cursor-pointer text-xl font-black text-[#173A2C]">
          + Add healthcare contact
        </summary>

        <form
          key={formKey}
          onSubmit={handleSubmit}
          className="mt-6 space-y-5"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="organisation_name"
                className="block text-sm font-bold"
              >
                Organisation name *
              </label>

              <input
                id="organisation_name"
                required
                maxLength={200}
                value={contact.organisation_name}
                onChange={(event) =>
                  updateField(
                    "organisation_name",
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-xl border border-[#173A2C]/20 bg-white px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="contact_name"
                className="block text-sm font-bold"
              >
                Contact name
              </label>

              <input
                id="contact_name"
                value={contact.contact_name}
                onChange={(event) =>
                  updateField("contact_name", event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-[#173A2C]/20 bg-white px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="category"
                className="block text-sm font-bold"
              >
                Category
              </label>

              <select
                id="category"
                value={contact.category}
                onChange={(event) =>
                  updateField("category", event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-[#173A2C]/20 bg-white px-4 py-3 text-sm"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-bold"
              >
                Email address
              </label>

              <input
                id="email"
                type="email"
                value={contact.email}
                onChange={(event) =>
                  updateField("email", event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-[#173A2C]/20 bg-white px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-bold"
              >
                Phone
              </label>

              <input
                id="phone"
                type="tel"
                value={contact.phone}
                onChange={(event) =>
                  updateField("phone", event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-[#173A2C]/20 bg-white px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="website"
                className="block text-sm font-bold"
              >
                Website
              </label>

              <input
                id="website"
                type="url"
                placeholder="https://"
                value={contact.website}
                onChange={(event) =>
                  updateField("website", event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-[#173A2C]/20 bg-white px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="suburb"
                className="block text-sm font-bold"
              >
                Suburb / region
              </label>

              <input
                id="suburb"
                value={contact.suburb}
                onChange={(event) =>
                  updateField("suburb", event.target.value)
                }
                className="mt-2 w-full rounded-xl border border-[#173A2C]/20 bg-white px-4 py-3 text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-bold"
              >
                Priority
              </label>

              <select
                id="priority"
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

          <div>
            <label
              htmlFor="new_contact_notes"
              className="block text-sm font-bold"
            >
              Notes
            </label>

            <textarea
              id="new_contact_notes"
              rows={3}
              maxLength={10000}
              value={contact.notes}
              onChange={(event) =>
                updateField("notes", event.target.value)
              }
              placeholder="Relevant services, contact information or referral opportunities..."
              className="mt-2 w-full rounded-xl border border-[#173A2C]/20 bg-white px-4 py-3 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-[#173A2C] px-6 py-3 text-sm font-bold text-[#FBF8F0] transition hover:bg-[#24533F] disabled:opacity-60"
          >
            {isPending ? "Adding contact..." : "Save healthcare contact"}
          </button>

          {message && (
            <p
              role="status"
              className="text-sm font-semibold text-green-800"
            >
              {message}
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="text-sm font-semibold text-red-700"
            >
              {error}
            </p>
          )}
        </form>
      </details>
    </section>
  );
}
