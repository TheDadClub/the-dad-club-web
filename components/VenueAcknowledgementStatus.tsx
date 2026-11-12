type Props = {
  status: string;
  acceptedAt: string | null;
};

const labels: Record<string, string> = {
  not_recorded: "Not recorded",
  pending: "Outcome pending",
  accepted: "Accepted for sending",
  failed: "Not accepted for sending",
  not_confirmed: "Sending outcome not confirmed",
};

function displayDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Adelaide",
  }).format(new Date(value));
}

export default function VenueAcknowledgementStatus({
  status,
  acceptedAt,
}: Props) {
  return (
    <section className="mt-6 rounded-2xl bg-[#E8EBDD] p-5">
      <h3 className="text-sm font-bold">
        Acknowledgement email
      </h3>

      <p className="mt-2 text-sm font-semibold">
        {labels[status] ?? "Unknown status"}
      </p>

      {status === "accepted" && acceptedAt && (
        <p className="mt-2 text-xs text-[#52645A]">
          {displayDate(acceptedAt)} · Australian Central time
        </p>
      )}

      <p className="mt-2 text-xs leading-relaxed text-[#52645A]">
        {status === "accepted"
          ? "Resend accepted the email. This does not confirm inbox delivery."
          : status === "not_recorded"
            ? "No acknowledgement sending outcome was recorded for this enquiry."
            : status === "pending"
              ? "A final outcome has not been recorded. The request may still be processing or may have been interrupted."
              : status === "failed"
                ? "The email was not accepted for sending or email configuration was unavailable. The enquiry remains saved."
                : "We could not confirm the sending outcome. The enquiry remains saved."}
      </p>

      <p className="mt-2 text-xs leading-relaxed text-[#52645A]">
        Saving a venue review does not resend this email.
      </p>
    </section>
  );
}