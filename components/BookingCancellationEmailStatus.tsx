import { displaySessionDate } from "../lib/programSessions";

type Props = {
  status: string;
  acceptedAt: string | null;
};

const labels: Record<string, string> = {
  pending: "Pending",
  accepted: "Accepted for sending",
  not_confirmed: "Acceptance not confirmed",
  skipped: "Skipped",
  not_recorded: "Not recorded",
  unavailable: "Status unavailable",
};

const explanations: Record<string, string> = {
  pending:
    "No final sending outcome has been recorded. Check Resend before considering another send.",
  accepted:
    "Resend accepted the cancellation email. This does not confirm inbox delivery.",
  not_confirmed:
    "The cancellation is saved, but email acceptance could not be confirmed. A timed-out request may still have succeeded. Check Resend before considering another send.",
  skipped:
    "The email was not sent because the booking was no longer cancelled when checked.",
  not_recorded:
    "No cancellation-email record is available. Older cancellations were not automatically emailed.",
  unavailable:
    "Cancellation-email tracking could not be loaded. Check Resend before considering another send.",
};

export default function BookingCancellationEmailStatus({
  status,
  acceptedAt,
}: Props) {
  const needsReview =
    status === "pending" ||
    status === "not_confirmed" ||
    status === "unavailable";

  return (
    <div
      className={`mt-5 rounded-xl border p-4 text-sm ${
        needsReview
          ? "border-[#C96632]/30 bg-[#C96632]/5"
          : "border-[#173A2C]/10 bg-[#E8EBDD]/60"
      }`}
    >
      <p className="font-bold">
        Cancellation email → {labels[status] ?? "Unknown"}
      </p>

      <p className="mt-2 leading-relaxed text-[#52645A]">
        {explanations[status] ??
          "Review the sending record before taking further action."}
      </p>

      {status === "accepted" && acceptedAt && (
        <p className="mt-2 text-xs text-[#52645A]">
          Acceptance recorded: {displaySessionDate(acceptedAt)}
          {" "}— Adelaide time
        </p>
      )}
    </div>
  );
}