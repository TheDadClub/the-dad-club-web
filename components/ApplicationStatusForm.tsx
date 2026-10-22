"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { saveApplicationStatus } from "../app/admin/facilitators/actions";
import {
  facilitatorApplicationStatuses,
  type FacilitatorApplicationStatus,
} from "../lib/facilitatorApplications";

type ApplicationStatusFormProps = {
  applicationId: string;
  currentStatus: FacilitatorApplicationStatus;
  reviewVersion: number;
  filter: string;
  page: number;
};

function SaveButton({ changed }: { changed: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || !changed}
      className="rounded-full bg-[#173A2C] px-6 py-3 text-sm font-bold text-[#F4F0E5] transition hover:bg-[#245540] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C96632] disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save status"}
    </button>
  );
}

export default function ApplicationStatusForm({
  applicationId,
  currentStatus,
  reviewVersion,
  filter,
  page,
}: ApplicationStatusFormProps) {
  const [selectedStatus, setSelectedStatus] =
    useState<FacilitatorApplicationStatus>(currentStatus);

  const selectId = `application-status-${applicationId}`;

  return (
    <form
      action={saveApplicationStatus}
      className="mt-6 border-t border-[#173A2C]/15 pt-5"
    >
      <input
        type="hidden"
        name="application_id"
        value={applicationId}
      />

      <input
        type="hidden"
        name="review_version"
        value={reviewVersion}
      />

      <input type="hidden" name="filter" value={filter} />
      <input type="hidden" name="page" value={page} />

      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1 sm:max-w-xs">
          <label
            htmlFor={selectId}
            className="block text-sm font-bold"
          >
            Application status
          </label>

          <select
            id={selectId}
            name="status"
            value={selectedStatus}
            onChange={(event) =>
              setSelectedStatus(
                event.target.value as FacilitatorApplicationStatus,
              )
            }
            required
            className="mt-2 w-full rounded-xl border border-[#173A2C]/20 bg-[#F4F0E5] px-4 py-3 text-base focus:border-[#C96632] focus:outline-none focus:ring-2 focus:ring-[#C96632]/25"
          >
            {facilitatorApplicationStatuses.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <SaveButton changed={selectedStatus !== currentStatus} />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-[#52645A]">
        Saving updates the review record only. It does not send an
        email, delete the application or grant facilitator access.
      </p>
    </form>
  );
}