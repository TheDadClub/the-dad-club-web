import type { SupabaseClient } from "@supabase/supabase-js";
import {
  displaySessionDate,
  sessionTitle,
} from "./programSessions";

type EmailOutcome = "accepted" | "not_confirmed" | "skipped";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendBookingConfirmation(
  database: SupabaseClient,
  bookingId: string,
): Promise<EmailOutcome> {
  // Claim this pending email before attempting to send.
  // An interrupted attempt remains "not_confirmed" for manual review.
  // Calling this function again will not automatically resend it.
  try {
    const { data, error } = await database
      .from("booking_confirmation_emails")
      .update({
        status: "not_confirmed",
        accepted_at: null,
      })
      .eq("booking_id", bookingId)
      .eq("status", "pending")
      .select("booking_id")
      .maybeSingle();

    if (error || !data) {
      console.error(
        "Booking confirmation: pending email could not be claimed.",
      );
      return "not_confirmed";
    }
  } catch {
    console.error(
      "Booking confirmation: email tracking unavailable.",
    );
    return "not_confirmed";
  }

  async function recordOutcome(
    status: "accepted" | "skipped",
  ): Promise<boolean> {
    try {
      const { data, error } = await database
        .from("booking_confirmation_emails")
        .update({
          status,
          accepted_at:
            status === "accepted" ? new Date().toISOString() : null,
        })
        .eq("booking_id", bookingId)
        .eq("status", "not_confirmed")
        .select("booking_id")
        .maybeSingle();

      if (error || !data) {
        console.error(
          "Booking confirmation: outcome could not be recorded.",
        );
        return false;
      }

      return true;
    } catch {
      console.error(
        "Booking confirmation: outcome tracking unavailable.",
      );
      return false;
    }
  }

  try {
    const { data: booking, error: bookingError } = await database
      .from("session_bookings")
      .select("id,member_id,session_id,status")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      console.error(
        "Booking confirmation: booking details unavailable.",
      );
      return "not_confirmed";
    }

    if (booking.status !== "booked") {
      const recorded = await recordOutcome("skipped");
      return recorded ? "skipped" : "not_confirmed";
    }

    const [memberResult, sessionResult] = await Promise.all([
      database
        .from("members")
        .select("email,status")
        .eq("id", booking.member_id)
        .maybeSingle(),

      database
        .from("program_sessions")
        .select(
          "session_number,starts_at,ends_at,venue_name,venue_address,status",
        )
        .eq("id", booking.session_id)
        .maybeSingle(),
    ]);

    if (
      memberResult.error ||
      sessionResult.error ||
      !memberResult.data ||
      !sessionResult.data
    ) {
      console.error(
        "Booking confirmation: member or session details unavailable.",
      );
      return "not_confirmed";
    }

    const member = memberResult.data;
    const session = sessionResult.data;

    if (
      member.status !== "active" ||
      session.status !== "published" ||
      Date.parse(session.starts_at) <= Date.now()
    ) {
      const recorded = await recordOutcome("skipped");
      return recorded ? "skipped" : "not_confirmed";
    }

    const email =
      typeof member.email === "string"
        ? member.email.trim().toLowerCase()
        : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error(
        "Booking confirmation: recipient address is invalid.",
      );
      return "not_confirmed";
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;

    if (!apiKey || !from) {
      console.error(
        "Booking confirmation: missing server configuration.",
      );
      return "not_confirmed";
    }

    const title = sessionTitle(session.session_number);
    const starts = displaySessionDate(session.starts_at);
    const ends = displaySessionDate(session.ends_at);
    const venueName = String(session.venue_name ?? "");
    const venueAddress = String(session.venue_address ?? "");

    const details = [
      ["Session", `${session.session_number}. ${title}`],
      ["Starts", starts],
      ["Ends", ends],
      ["Time zone", "Adelaide time, including daylight saving"],
      ["Venue / delivery", venueName || "Contact us for details"],
      ...(venueAddress ? [["Address / details", venueAddress]] : []),
      ["Booking reference", bookingId],
    ];

    const text = [
      "You're booked in.",
      "",
      "Your place at this Dad Club session is confirmed.",
      "",
      ...details.map(([label, value]) => `${label}: ${value}`),
      "",
      "A place for honest conversations about adjusting to fatherhood, wellbeing, relationships and connection. You don't need to have all the answers.",
      "",
      "Need to change your booking or ask a question? Reply to this email.",
      "",
      "For an online session, contact us if you need joining details.",
      "",
      "This email confirms your booking. It is not a receipt or proof of payment.",
      "",
      "If you weren't expecting this booking, reply and let us know.",
      "",
      "The Dad Club",
      "Real dads. Real conversations. No perfect answers.",
      "hello@thedadclub.com.au",
      "https://thedadclub.com.au",
    ].join("\n");

    const html = `
      <!doctype html>
      <html lang="en-AU">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>The Dad Club — Booking confirmed</title>
        </head>
        <body style="margin:0;padding:24px 12px;background:#F4F0E5;color:#173A2C;font-family:Inter,Arial,Helvetica,sans-serif;">
          <table role="presentation" style="width:100%;max-width:600px;margin:0 auto;border-collapse:collapse;">
            <tr>
              <td style="padding:28px;background:#173A2C;color:#F4F0E5;">
                <p style="margin:0;font-size:18px;font-weight:bold;">
                  THE DAD CLUB <span style="color:#D6A17C;">&rarr;</span>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;background:#FBF8F0;">
                <p style="margin:0 0 16px;font-size:12px;font-weight:bold;letter-spacing:2px;color:#C96632;">
                  BOOKING CONFIRMED
                </p>
                <h1 style="margin:0 0 24px;font-size:30px;line-height:1.2;">
                  You&apos;re booked in.
                </h1>
                <p style="font-size:16px;line-height:1.7;">
                  Your place at this Dad Club session is confirmed.
                </p>

                <table role="presentation" style="width:100%;margin:24px 0;border-collapse:collapse;background:#E8EBDD;">
                  ${details
                    .map(
                      ([label, value]) => `
                        <tr>
                          <td style="padding:12px 16px;font-size:14px;line-height:1.6;vertical-align:top;font-weight:bold;">
                            ${escapeHtml(label)}
                          </td>
                          <td style="padding:12px 16px;font-size:14px;line-height:1.6;vertical-align:top;overflow-wrap:anywhere;word-break:break-word;">
                            ${escapeHtml(value)}
                          </td>
                        </tr>
                      `,
                    )
                    .join("")}
                </table>

                <p style="font-size:16px;line-height:1.7;">
                  A place for honest conversations about adjusting to
                  fatherhood, wellbeing, relationships and connection.
                  You don&apos;t need to have all the answers.
                </p>
                <p style="font-size:16px;line-height:1.7;">
                  Need to change your booking or ask a question?
                  Reply to this email.
                </p>
                <p style="font-size:14px;line-height:1.7;color:#52645A;">
                  For an online session, contact us if you need joining details.
                </p>
                <p style="font-size:13px;line-height:1.7;color:#52645A;">
                  This email confirms your booking. It is not a receipt
                  or proof of payment.
                </p>
                <p style="font-size:13px;line-height:1.7;color:#52645A;">
                  If you weren&apos;t expecting this booking, reply and let us know.
                </p>
                <p style="margin:28px 0 8px;font-weight:bold;">
                  The Dad Club
                </p>
                <p style="margin:0;font-size:13px;line-height:1.7;color:#52645A;">
                  Real dads. Real conversations. No perfect answers.
                </p>
                <p style="margin-top:24px;font-size:13px;line-height:1.7;">
                  <a href="https://thedadclub.com.au/privacy/website" style="color:#173A2C;">
                    Website privacy notice
                  </a>
                </p>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    // Check again immediately before the sending request.
    const { data: currentBooking, error: currentError } = await database
      .from("session_bookings")
      .select("status")
      .eq("id", bookingId)
      .maybeSingle();

    if (currentError || !currentBooking) {
      console.error(
        "Booking confirmation: final booking check unavailable.",
      );
      return "not_confirmed";
    }

    if (currentBooking.status !== "booked") {
      const recorded = await recordOutcome("skipped");
      return recorded ? "skipped" : "not_confirmed";
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `booking-confirmation/${bookingId}`,
      },
      body: JSON.stringify({
        from,
        to: [email],
        reply_to: "hello@thedadclub.com.au",
        subject: `The Dad Club — ${title}: booking confirmed`,
        text,
        html,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(
        "Booking confirmation: provider returned status",
        response.status,
      );
      return "not_confirmed";
    }

    const result: { id?: string } = await response.json();

    if (typeof result.id !== "string" || !result.id) {
      console.error(
        "Booking confirmation: provider acceptance not confirmed.",
      );
      return "not_confirmed";
    }

    const recorded = await recordOutcome("accepted");

    return recorded ? "accepted" : "not_confirmed";
  } catch {
    console.error(
      "Booking confirmation: sending outcome not confirmed.",
    );
    return "not_confirmed";
  }
}