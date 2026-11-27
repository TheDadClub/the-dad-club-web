
"use client";

import { useState, useTransition } from "react";
import { updateHealthcareNotes } from "./actions";

type Props = {
  referralId: string;
  initialNotes: string | null;
  initialFollowUp: string | null;
};

export default function NotesEditor({
  referralId,
  initialNotes,
  initialFollowUp,
}: Props) {
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [followUp, setFollowUp] = useState(
    initialFollowUp ?? ""
  );
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleSave() {
    setMessage("");
    setError("");

    startTransition(async () => {
      try {
        await updateHealthcareNotes(
          referralId,
          notes,
          followUp || null
        );

        setMessage("Changes saved successfully.");
      } catch {
        setError("Unable to save changes. Please try again.");
      }
    });
  }

  return (
    <div className="mt-5 border-t border-[#173A2C]/10 pt-5">
      <details>
        <summary className="cursor-pointer text-sm font-bold text-[#173A2C]">
          Notes & follow-up
        </summary>

        <div className="mt-5 space-y-5">
          <div>
            <label
              htmlFor={`notes-${referralId}`}
              className="block text-sm font-bold"
            >
              Contact notes
            </label>

            <textarea
              id={`notes-${referralId}`}
              value={notes}
              onChange={(event) =>
                setNotes(event.target.value)
              }
              rows={4}
              maxLength={10000}
              placeholder="Record conversations, responses, useful information or next steps..."
              className="mt-2 w-full rounded-xl border border-[#173A2C]/20 bg-white p-3 text-sm text-[#173A2C] outline-none focus:border-[#C96632]"
            />
          </div>

          <div>
            <label
              htmlFor={`followup-${referralId}`}
              className="block text-sm font-bold"
            >
              Follow-up date
            </label>

            <input
              id={`followup-${referralId}`}
              type="date"
              value={followUp}
              onChange={(event) =>
                setFollowUp(event.target.value)
              }
              className="mt-2 rounded-xl border border-[#173A2C]/20 bg-white px-4 py-3 text-sm text-[#173A2C] outline-none focus:border-[#C96632]"
            />
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-full bg-[#173A2C] px-6 py-3 text-sm font-bold text-[#FBF8F0] transition hover:bg-[#24533F] disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save changes"}
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
        </div>
      </details>
    </div>
  );
}
