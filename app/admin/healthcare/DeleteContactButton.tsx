"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteHealthcareContact } from "./actions";

type Props = {
  referralId: string;
  organisationName: string;
};

export default function DeleteContactButton({
  referralId,
  organisationName,
}: Props) {
  const router = useRouter();

  const [confirming, setConfirming] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleDelete() {
    if (!acknowledged || isPending) return;

    setError("");

    startTransition(async () => {
      try {
        await deleteHealthcareContact(referralId);
        setConfirming(false);
        setAcknowledged(false);
        router.refresh();
      } catch {
        setError(
          "Unable to delete contact. Please refresh and try again."
        );
      }
    });
  }

  return (
    <div className="mt-5 border-t border-[#173A2C]/10 pt-5">
      {!confirming ? (
        <button
          type="button"
          onClick={() => {
            setConfirming(true);
            setAcknowledged(false);
            setError("");
          }}
          className="text-sm font-semibold text-red-700 underline underline-offset-4 hover:text-red-900"
        >
          Delete contact
        </button>
      ) : (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-900">
            Permanently delete this healthcare contact?
          </p>

          <p className="mt-2 break-words text-sm text-red-800">
            You are about to permanently delete{" "}
            <strong>{organisationName}</strong>.
          </p>

          <p className="mt-3 text-sm text-red-800">
            This will remove the contact record, internal
            notes, follow-up dates and associated
            communication history from The Dad Club.
          </p>

          <p className="mt-3 text-sm text-red-800">
            Original emails in Outlook will not be deleted.
            This dashboard action cannot be undone.
          </p>

          <label className="mt-4 flex items-start gap-3 text-sm font-semibold text-red-900">
            <input
              type="checkbox"
              checked={acknowledged}
              disabled={isPending}
              onChange={(event) =>
                setAcknowledged(event.target.checked)
              }
              className="mt-1 h-4 w-4 accent-red-700"
            />

            <span>
              I understand that the contact and its
              recorded communication history will be
              permanently removed.
            </span>
          </label>

          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending || !acknowledged}
              className="rounded-full bg-red-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isPending
                ? "Deleting..."
                : "Yes, permanently delete"}
            </button>

            <button
              type="button"
              onClick={() => {
                setConfirming(false);
                setAcknowledged(false);
                setError("");
              }}
              disabled={isPending}
              className="rounded-full border border-[#173A2C]/20 px-5 py-2.5 text-sm font-bold text-[#173A2C] disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 text-sm font-semibold text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
