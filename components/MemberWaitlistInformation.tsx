export default function MemberWaitlistInformation() {
  const enabled =
    process.env.WAITLIST_EMAILS_ENABLED === "true";

  return (
    <div className="mt-4 max-w-3xl space-y-4 text-sm leading-relaxed text-[#52645A]">
      <div className="rounded-2xl bg-[#E8EBDD] p-5">
        <p className="font-bold text-[#173A2C]">
          Good conversations need a few dads around the table.
        </p>

        <p className="mt-2">
          Sessions need at least six dads booked for that
          date to go ahead. If minimum numbers aren&apos;t
          reached, we&apos;ll contact you about alternative
          arrangements.
        </p>
      </div>

      <p>
        An available entitlement means you can book that
        session type. Each date has its own capacity.
        Joining a waitlist does not reserve a place or
        use your entitlement.
      </p>

      <p>
        Your waitlist status is shown below. An email
        is not sent just for joining a waitlist.
      </p>

      <p>
        {enabled
          ? "While you remain eligible, we'll try to email you once per waitlist joining when a place becomes available. You'll need to sign in and book; the email does not hold the place."
          : "Automatic availability emails are currently paused. Please check this page for openings or contact us."}
      </p>

      <p>
        Availability can change before an email arrives.
        If you receive an alert and the session is full
        again, your waitlist entry remains. Check back
        for further openings; repeat alerts are not
        sent for the same joining.
      </p>
    </div>
  );
}