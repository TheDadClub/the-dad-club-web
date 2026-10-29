import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { buildBookingCancellationEmail } from "./bookingCancellationEmail";

export type CancellationEmailOutcome =
  | "accepted"
  | "not_confirmed"
  | "skipped";

export async function sendBookingCancellation(
  database: SupabaseClient,
  bookingId: string,
): Promise<CancellationEmailOutcome> {
  // Claim the pending email before contacting the provider.
  // Interrupted or uncertain attempts are not automatically retried.
  try {
    const { data, error } = await database
      .from("booking_cancellation_emails")
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
        "Booking cancellation: pending email could not be claimed.",
      );
      return "not_confirmed";
    }
  } catch {
    console.error(
      "Booking cancellation: email tracking unavailable.",
    );
    return "not_confirmed";
  }

  async function recordOutcome(
    status: "accepted" | "skipped",
  ): Promise<boolean> {
    try {
      const { data, error } = await database
        .from("booking_cancellation_emails")
        .update({
          status,
          accepted_at:
            status === "accepted"
              ? new Date().toISOString()
              : null,
        })
        .eq("booking_id", bookingId)
        .eq("status", "not_confirmed")
        .select("booking_id")
        .maybeSingle();

      if (error || !data) {
        console.error(
          "Booking cancellation: outcome could not be recorded.",
        );
        return false;
      }

      return true;
    } catch {
      console.error(
        "Booking cancellation: outcome tracking unavailable.",
      );
      return false;
    }
  }

  try {
    const { data: booking, error: bookingError } = await database
      .from("session_bookings")
      .select("id, member_id, session_id, status")
      .eq("id", bookingId)
      .maybeSingle();

    if (bookingError || !booking) {
      console.error(
        "Booking cancellation: booking details unavailable.",
      );
      return "not_confirmed";
    }

    if (booking.status !== "cancelled") {
      const recorded = await recordOutcome("skipped");
      return recorded ? "skipped" : "not_confirmed";
    }

    const [memberResult, sessionResult] = await Promise.all([
      database
        .from("members")
        .select("email")
        .eq("id", booking.member_id)
        .maybeSingle(),

      database
        .from("program_sessions")
        .select("session_number, starts_at, venue_name")
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
        "Booking cancellation: member or session details unavailable.",
      );
      return "not_confirmed";
    }

    const member = memberResult.data;
    const session = sessionResult.data;

    const email =
      typeof member.email === "string"
        ? member.email.trim().toLowerCase()
        : "";

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error(
        "Booking cancellation: recipient address is invalid.",
      );
      return "not_confirmed";
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;

    if (!apiKey || !from) {
      console.error(
        "Booking cancellation: missing server configuration.",
      );
      return "not_confirmed";
    }

    const message = buildBookingCancellationEmail(
      {
        booking_id: bookingId,
        email,
        session_number: session.session_number,
        starts_at: session.starts_at,
        venue_name: String(session.venue_name ?? ""),
      },
      from,
    );

    // Cancellation notices remain relevant for archived members
    // and unpublished or past sessions.
    // The booking itself must still be cancelled.
    const { data: currentBooking, error: currentError } =
      await database
        .from("session_bookings")
        .select("status")
        .eq("id", bookingId)
        .maybeSingle();

    if (currentError || !currentBooking) {
      console.error(
        "Booking cancellation: final booking check unavailable.",
      );
      return "not_confirmed";
    }

    if (currentBooking.status !== "cancelled") {
      const recorded = await recordOutcome("skipped");
      return recorded ? "skipped" : "not_confirmed";
    }

    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `booking-cancellation/${bookingId}`,
        },
        body: JSON.stringify(message),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      console.error(
        "Booking cancellation: provider returned status",
        response.status,
      );
      return "not_confirmed";
    }

    const result: { id?: string } = await response.json();

    if (
      typeof result.id !== "string" ||
      !result.id.trim()
    ) {
      console.error(
        "Booking cancellation: provider acceptance not confirmed.",
      );
      return "not_confirmed";
    }

    const recorded = await recordOutcome("accepted");

    return recorded ? "accepted" : "not_confirmed";
  } catch {
    console.error(
      "Booking cancellation: sending outcome not confirmed.",
    );
    return "not_confirmed";
  }
}