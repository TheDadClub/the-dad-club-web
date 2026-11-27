"use client";

import { useState } from "react";

import {
  VENUE_OUTREACH_SUBJECT,
  type VenueOutreachStatus,
} from "../../../../lib/venueOutreach";

const DEFAULT_BODY = `Hello,

I'm Pete, founder of The Dad Club, an Australian initiative supporting first-time fathers through pregnancy and the first two years of parenthood.

We're looking to partner with local venues to host small, relaxed group sessions where dads can connect, share experiences and build supportive relationships.

We're primarily seeking free or donated community spaces, ideally offering:

- A quiet or private space for 6–12 dads.
- Availability on Monday to Thursday evenings, around dinner time.
- Access to a TV or projector for occasional presentation content.

We would encourage participants to purchase food and drinks from the venue, providing an opportunity to support your business while creating something meaningful for local families.

If this sounds like something your venue might be interested in, you can find more information and register your interest here:

https://thedadclub.com.au/venues

I'd love to hear from you.

Cheers,
Pete Mann
Founder | The Dad Club
https://thedadclub.com.au
hello@thedadclub.com.au`;

type Props = {
  contactId: string;
  recipientEmail: string;
  currentStatus: VenueOutreachStatus;
};

export default function VenueEmailComposer({
  contactId,
  recipientEmail,
  currentStatus,
}: Props) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [result, setResult] = useState("");

  const canPrepare =
    Boolean(recipientEmail.trim()) &&
    currentStatus === "Not contacted";

  async function copyText(
    value: string,
    label: string
  ) {
    try {
      await navigator.clipboard.writeText(value);
      setResult(`${label} copied to clipboard.`);
    } catch {
      setResult(
        "Unable to copy automatically. Please copy the text manually."
      );
    }
  }

  const outlookComposeUrl =
    "https://outlook.office.com/mail/deeplink/compose?" +
    new URLSearchParams({
      to: recipientEmail,
      subject: VENUE_OUTREACH_SUBJECT,
      body,
    }).toString();

  const copyButtonClass =
    "rounded-lg border border-[#173A2C]/20 bg-white px-3 py-2 text-xs font-bold text-[#173A2C] hover:bg-[#E8EBDD] disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="rounded-xl border border-[#173A2C]/15 bg-white p-4">
      <button
        type="button"
        onClick={() => {
          setOpen(!open);
          setResult("");
        }}
        className="text-sm font-bold text-[#173A2C] underline underline-offset-4"
      >
        {open
          ? "Close email preview"
          : "Prepare Venue Outreach Email"}
      </button>

      {open && (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl bg-[#E8EBDD] p-4">
            <p className="text-sm font-bold">
              Send through Outlook
            </p>

            <p className="mt-2 text-sm leading-relaxed text-[#52645A]">
              Prepare your partnership email here,
              then review and send it through Outlook.
              Your contact status will update when
              synchronisation detects the sent email.
            </p>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[#52645A]">
                Recipient
              </p>

              <button
                type="button"
                disabled={!canPrepare}
                onClick={() =>
                  copyText(recipientEmail, "Recipient")
                }
                className={copyButtonClass}
              >
                Copy email
              </button>
            </div>

            <p className="mt-2 break-all text-sm font-semibold">
              {recipientEmail}
            </p>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[#52645A]">
                Subject
              </p>

              <button
                type="button"
                disabled={!canPrepare}
                onClick={() =>
                  copyText(
                    VENUE_OUTREACH_SUBJECT,
                    "Subject"
                  )
                }
                className={copyButtonClass}
              >
                Copy subject
              </button>
            </div>

            <p className="mt-2 text-sm">
              {VENUE_OUTREACH_SUBJECT}
            </p>

            <p className="mt-2 text-xs text-[#52645A]">
              Keep this subject unchanged to allow
              automatic initial outreach matching.
            </p>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor={`venue-email-${contactId}`}
                className="text-sm font-bold"
              >
                Email message
              </label>

              <button
                type="button"
                disabled={!canPrepare || !body.trim()}
                onClick={() =>
                  copyText(body, "Email message")
                }
                className={copyButtonClass}
              >
                Copy message
              </button>
            </div>

            <textarea
              id={`venue-email-${contactId}`}
              value={body}
              onChange={(event) => {
                setBody(event.target.value);
                setResult("");
              }}
              rows={18}
              maxLength={10000}
              disabled={!canPrepare}
              className="mt-2 w-full rounded-xl border border-[#173A2C]/20 bg-[#FBF8F0] p-4 text-sm leading-relaxed text-[#173A2C] disabled:opacity-60"
            />

            <button
              type="button"
              disabled={!canPrepare}
              onClick={() => {
                setBody(DEFAULT_BODY);
                setResult("Default message restored.");
              }}
              className="mt-2 text-xs font-semibold text-[#52645A] underline underline-offset-4 disabled:opacity-40"
            >
              Restore default message
            </button>
          </div>

          {!canPrepare && (
            <p className="rounded-xl bg-[#F4F0E5] p-3 text-sm text-[#52645A]">
              Initial outreach is available for venues
              marked Not contacted. Continue existing
              conversations directly in Outlook.
            </p>
          )}

          {result && (
            <p
              role="status"
              className="rounded-xl bg-[#E8EBDD] p-3 text-sm"
            >
              {result}
            </p>
          )}

          {canPrepare && body.trim() && (
            <a
              href={outlookComposeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-xl bg-[#173A2C] px-5 py-3 text-sm font-bold text-white hover:opacity-90"
            >
              Open in Outlook
            </a>
          )}

          <p className="text-xs leading-relaxed text-[#52645A]">
            Send from hello@thedadclub.com.au.
            Opening Outlook does not send an email
            or change the venue&apos;s status.
          </p>

          <a
            href="https://outlook.office.com/mail/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block text-xs font-bold text-[#173A2C] underline underline-offset-4"
          >
            Open Outlook mailbox
          </a>
        </div>
      )}
    </div>
  );
}
