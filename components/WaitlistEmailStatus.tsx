import { displaySessionDate } from "../lib/programSessions";

export type WaitlistEmailRecord = {
  waitlist_id: string;
  waitlist_joined_at: string;
  status: string;
  accepted_at: string | null;
  next_attempt_at: string;
  attempts: number;
};

export default function WaitlistEmailStatus({
  email,
  available,
}: {
  email?: WaitlistEmailRecord;
  available: boolean;
}) {
  const labels: Record<string, string> = {
    queued: "Queued",
    processing: "Processing",
    accepted: "Accepted for sending",
    skipped: "Skipped",
    review: "Needs review",
  };

  const explanations: Record<string, string> = {
    queued:
      "Waiting for an eligible sending attempt. The session must still have space and the member must remain eligible.",
    processing:
      "A worker has claimed this email. Refresh later for its recorded outcome.",
    accepted:
      "Resend accepted the email. This does not guarantee inbox delivery.",
    skipped:
      "The waiting entry, member or session was no longer eligible when checked.",
    review:
      "Automatic attempts have stopped. Check Resend and the current member/session details before considering any further send.",
  };

  return (
    <div className="mt-5 rounded-2xl bg-[#E8EBDD] p-4 text-sm">
      <p className="font-bold">Availability email</p>

      {!available ? (
        <p className="mt-2 leading-relaxed text-[#8D3E21]">
          Sending status could not be loaded. Check Resend before
          considering another send.
        </p>
      ) : !email ? (
        <p className="mt-2 leading-relaxed text-[#52645A]">
          Not queued for this joining. When automation is enabled,
          eligible waiting entries are checked for available places.
        </p>
      ) : (
        <>
          <p className="mt-2 font-semibold">
            {labels[email.status] ?? "Unknown"}
          </p>

          <p className="mt-2 leading-relaxed text-[#52645A]">
            {explanations[email.status] ??
              "Check the recorded outcome before taking action."}
          </p>

          {email.status === "accepted" && email.accepted_at && (
            <p className="mt-2 text-xs text-[#52645A]">
              Acceptance recorded:{" "}
              {displaySessionDate(email.accepted_at)}
            </p>
          )}

          {email.status === "queued" && (
            <p className="mt-2 text-xs text-[#52645A]">
              Next attempt eligible from:{" "}
              {displaySessionDate(email.next_attempt_at)}
            </p>
          )}

          <p className="mt-2 text-xs text-[#52645A]">
            Processing attempts: {email.attempts}
          </p>
        </>
      )}
    </div>
  );
}