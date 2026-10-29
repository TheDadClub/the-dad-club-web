type Props = {
  status: string;
  acceptedAt: string | null;
};

const labels: Record<string, string> = {
  not_recorded: "Not recorded",
  pending: "Pending",
  accepted: "Accepted for sending",
  not_confirmed: "Send not confirmed",
};

const styles: Record<string, string> = {
  not_recorded: "bg-[#E8EBDD] text-[#52645A]",
  pending: "bg-[#C96632]/15 text-[#8D3E21]",
  accepted: "bg-[#173A2C] text-[#F4F0E5]",
  not_confirmed: "bg-[#C96632]/15 text-[#8D3E21]",
};

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Adelaide",
  }).format(new Date(value));
}

export default function ApplicationEmailStatus({
  status,
  acceptedAt,
}: Props) {
  return (
    <div className="mt-6 rounded-2xl border border-[#173A2C]/15 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold">Acknowledgement email</p>

        <span
          className={`rounded-full px-4 py-2 text-xs font-bold ${
            styles[status] ?? styles.not_recorded
          }`}
        >
          {labels[status] ?? "Unknown"}
        </span>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-[#52645A]">
        {status === "accepted"
          ? "Resend accepted this email. This does not confirm inbox delivery."
          : status === "pending"
            ? "A sending attempt was started. If this status remains, check Resend and the server logs."
            : status === "not_confirmed"
              ? "Email acceptance could not be confirmed. Check Resend before considering another send; a timed-out request may still have succeeded."
              : "No tracked sending outcome is available. This does not mean the email failed."}
      </p>

      {status === "accepted" && acceptedAt && (
        <p className="mt-2 text-xs text-[#52645A]">
          Acceptance recorded: {displayDate(acceptedAt)}
        </p>
      )}
    </div>
  );
}