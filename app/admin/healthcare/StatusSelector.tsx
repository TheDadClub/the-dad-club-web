"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateHealthcareStatus } from "./actions";

const statuses = [
  "Not contacted",
  "Emailed",
  "Responded",
  "Interested",
  "Sharing resources",
  "Declined",
];

type Props = {
  referralId: string;
  currentStatus: string;
};

export default function StatusSelector({
  referralId,
  currentStatus,
}: Props) {
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleChange(newStatus: string) {
    if (newStatus === currentStatus) return;

    setError("");

    startTransition(async () => {
      try {
        const result = await updateHealthcareStatus(
          referralId,
          newStatus,
          currentStatus
        );

        if (!result.success) {
          setError(result.message);
        }

        router.refresh();
      } catch {
        setError(
          "Unable to save. Refresh and review the current status."
        );
      }
    });
  }

  return (
    <div>
      <label
        htmlFor={`status-${referralId}`}
        className="sr-only"
      >
        Outreach status
      </label>

      <select
        id={`status-${referralId}`}
        value={currentStatus}
        onChange={(event) =>
          handleChange(event.target.value)
        }
        disabled={isPending}
        className="rounded-full border border-[#173A2C]/20 bg-[#E8EBDD] px-4 py-2 text-xs font-bold text-[#173A2C] disabled:opacity-60"
      >
        {statuses.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {isPending && (
        <p
          role="status"
          className="mt-2 text-xs text-[#52645A]"
        >
          Saving...
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="mt-2 text-xs text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
