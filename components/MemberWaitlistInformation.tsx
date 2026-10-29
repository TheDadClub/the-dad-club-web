export default function MemberWaitlistInformation() {
  const enabled =
    process.env.WAITLIST_EMAILS_ENABLED === "true";

  return (
    <div className="mt-4 max-w-3xl space-y-3 text-sm leading-relaxed text-[#52645A]">
      <p>
        An available entitlement means you can book that session
        type. Each date has its own capacity. Joining a waitlist
        does not reserve a place or use your entitlement.
      </p>

      <p>
        {enabled
          ? "While you remain eligible, we'll try to email you once per waitlist joining when a place becomes available. You'll need to sign in and book; the email does not hold the place."
          : "Automatic availability emails are currently paused. Please check this page for openings or contact us."}
      </p>

      <p>
        Availability can change before an email arrives. If you
        receive an alert and the session is full again, your
        waitlist entry remains. Check back for further openings;
        repeat alerts are not sent for the same joining.
      </p>
    </div>
  );
}