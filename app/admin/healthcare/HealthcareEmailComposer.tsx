
"use client";

import { useState } from "react";

const SUBJECT =
  "A new Australian resource for first-time dads";

const DEFAULT_BODY = `Hello,

I'm Pete, founder of The Dad Club, a new Australian app supporting first-time fathers through pregnancy and the first two years of parenthood.

Drawing on my background in education, psychology and my own experience as a dad, I've created something that offers practical advice, honest reflections and simple wellbeing check-ins — with a bit of humour along the way.

I'd love for you to take a quick look:

https://thedadclub.com.au/app

If you think it could benefit the families you support, I'd really appreciate you sharing it with expectant and new dads.

If you'd prefer not to receive further emails about The Dad Club, just reply and let me know.

Cheers,
Pete Mann
Founder | The Dad Club
https://thedadclub.com.au
hello@thedadclub.com.au`;

type Props = {
  referralId: string;
  recipientEmail: string | null;
  currentStatus: string;
};

export default function HealthcareEmailComposer({
  referralId,
  recipientEmail,
  currentStatus,
}: Props) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(DEFAULT_BODY);
  const [result, setResult] = useState("");

  const canPrepare =
    Boolean(recipientEmail?.trim()) &&
    currentStatus === "Not contacted";

  async function copyText(
    value: string,
    label: string
  ) {
    setResult("");

    try {
      await navigator.clipboard.writeText(value);
      setResult(`${label} copied to clipboard.`);
    } catch {
      setResult(
        "Unable to copy automatically. Please select and copy the text manually."
      );
    }
  }

  const outlookComposeUrl =
    "https://outlook.office.com/mail/deeplink/compose?" +
    new URLSearchParams({
      to: recipientEmail ?? "",
      subject: SUBJECT,
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
          : "Prepare Outreach Email"}
      </button>

      {open && (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl bg-[#E8EBDD] p-4">
            <p className="text-sm font-bold text-[#173A2C]">
              Send through Outlook
            </p>

            <p className="mt-1 text-sm leading-relaxed text-[#52645A]">
              Prepare your email here, then open Outlook
              to review, format and send it. Your outreach
              status will update automatically when the
              synchronisation service detects the sent email.
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
                  copyText(
                    recipientEmail ?? "",
                    "Recipient email"
                  )
                }
                className={copyButtonClass}
              >
                Copy email
              </button>
            </div>

            <p className="mt-1 break-all text-sm font-semibold">
              {recipientEmail || "No email address saved"}
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
                  copyText(SUBJECT, "Subject")
                }
                className={copyButtonClass}
              >
                Copy subject
              </button>
            </div>

            <p className="mt-1 text-sm">
              {SUBJECT}
            </p>

            <p className="mt-2 text-xs text-[#52645A]">
              Keep this subject unchanged so the initial
              outreach email can be matched automatically.
            </p>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor={`email-body-${referralId}`}
                className="block text-sm font-bold"
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
              id={`email-body-${referralId}`}
              value={body}
              onChange={(event) => {
                setBody(event.target.value);
                setResult("");
              }}
              rows={16}
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
              Initial outreach is available only for contacts
              with an email address and a status of
              Not contacted. For existing correspondence,
              continue the conversation directly in Outlook.
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
            <div className="space-y-3">
              <a
                href={outlookComposeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex rounded-xl bg-[#173A2C] px-5 py-3 text-sm font-bold text-white hover:opacity-90"
              >
                Open in Outlook
              </a>

              <p className="text-xs leading-relaxed text-[#52645A]">
                Make sure you are sending from
                hello@thedadclub.com.au.
                Opening Outlook does not send an email
                or change this contact&apos;s status.
              </p>

              <a
                href="https://outlook.office.com/mail/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs font-semibold text-[#173A2C] underline underline-offset-4"
              >
                Open Outlook mailbox instead
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
