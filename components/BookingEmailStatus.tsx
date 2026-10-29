type Props = {
  status: string;
  acceptedAt: string | null;
};

const labels: Record<string, string> = {
  not_recorded: "Not recorded",
  pending: "Pending",
  accepted: "Accepted for sending",
  not_confirmed: "Send not confirmed",
  skipped: "Not sent",
  unavailable: "Status unavailable",
};

const descriptions: Record<string, string> = {
  not_recorded:
    "No confirmation-email record is available for this booking. Older bookings have not been emailed automatically.",
  pending:
    "No final sending outcome is recorded. Check Resend and the server logs before considering another send.",
  accepted:
    "Resend accepted the confirmation email. This does not confirm inbox delivery.",
  not_confirmed:
    "Email acceptance could not be confirmed. Check Resend before considering another send; a timed-out request may still have succeeded.",
  skipped:
    "The confirmation was not sent because the booking, member or session was no longer eligible when checked.",
  unavailable:
    "Email tracking could not be loaded. Check Resend before considering another send.",
};

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Adelaide",
  }).format(new Date(value));
}

export default function BookingEmailStatus({
  status,
  acceptedAt,
}: Props) {
  const badgeClass =
    status === "accepted"
      ? "bg-[#173A2C] text-[#F4F0E5]"
      : ["pending", "not_confirmed", "unavailable"].includes(status)
        ? "bg-[#C96632]/15 text-[#8D3E21]"
        : "bg-[#E8EBDD] text-[#52645A]";

  return (
    <div className="mt-6 rounded-2xl border border-[#173A2C]/15 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold">Booking confirmation email</p>

        <span
          className={`rounded-full px-4 py-2 text-xs font-bold ${badgeClass}`}
        >
          {labels[status] ?? "Unknown"}
        </span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-[#52645A]">
        {descriptions[status] ??
          "Check Resend for information about this email."}
      </p>

      {status === "accepted" && acceptedAt && (
        <p className="mt-2 text-xs text-[#52645A]">
          Acceptance recorded: {displayDate(acceptedAt)}
        </p>
      )}
    </div>
  );
}