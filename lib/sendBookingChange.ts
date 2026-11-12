import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildBookingChangeEmail,
  type ChangedSessionDetails,
} from "./bookingChangeEmail";

export type BookingChangeEmailOutcome =
  | "accepted"
  | "not_confirmed"
  | "skipped";

type ChangeRecord = {
  id: string;
  member_id: string;
  old_booking_id: string;
  new_booking_id: string;
  session_number: number;
  recipient_email: string;
  old_session_details: ChangedSessionDetails;
  new_session_details: ChangedSessionDetails;
};

function sameTime(first: string, second: string) {
  const firstTime = Date.parse(first);
  const secondTime = Date.parse(second);

  return (
    Number.isFinite(firstTime) &&
    Number.isFinite(secondTime) &&
    firstTime === secondTime
  );
}

export async function sendBookingChange(
  database: SupabaseClient,
  changeId: string,
  memberId: string,
): Promise<BookingChangeEmailOutcome> {
  let change: ChangeRecord;

  // Claim once. Interrupted or uncertain sends are not retried
  // automatically, preventing accidental duplicate messages.
  try {
    const { data, error } = await database
      .from("booking_changes")
      .update({
        email_status: "not_confirmed",
        email_accepted_at: null,
      })
      .eq("id", changeId)
      .eq("member_id", memberId)
      .eq("email_status", "pending")
      .select(
        "id, member_id, old_booking_id, new_booking_id, session_number, recipient_email, old_session_details, new_session_details",
      )
      .maybeSingle();

    if (error || !data) {
      console.error("Booking change: email could not be claimed.");
      return "not_confirmed";
    }

    change = data as ChangeRecord;
  } catch {
    console.error("Booking change: email tracking unavailable.");
    return "not_confirmed";
  }

  async function recordOutcome(
    status: "accepted" | "skipped",
  ): Promise<BookingChangeEmailOutcome> {
    try {
      const { data, error } = await database
        .from("booking_changes")
        .update({
          email_status: status,
          email_accepted_at:
            status === "accepted"
              ? new Date().toISOString()
              : null,
        })
        .eq("id", changeId)
        .eq("member_id", memberId)
        .eq("email_status", "not_confirmed")
        .select("id")
        .maybeSingle();

      if (error || !data) {
        console.error("Booking change: outcome could not be recorded.");
        return "not_confirmed";
      }

      return status;
    } catch {
      console.error("Booking change: outcome tracking unavailable.");
      return "not_confirmed";
    }
  }

  try {
    const [bookingsResult, memberResult, sessionResult] =
      await Promise.all([
        database
          .from("session_bookings")
          .select("id, member_id, session_id, status")
          .in("id", [
            change.old_booking_id,
            change.new_booking_id,
          ])
          .eq("member_id", memberId),

        database
          .from("members")
          .select("email, status")
          .eq("id", memberId)
          .maybeSingle(),

        database
          .from("program_sessions")
          .select(
            "id, session_number, starts_at, ends_at, venue_name, venue_address, status",
          )
          .eq("id", change.new_session_details.session_id)
          .maybeSingle(),
      ]);

    if (
      bookingsResult.error ||
      memberResult.error ||
      sessionResult.error ||
      !memberResult.data ||
      !sessionResult.data
    ) {
      console.error("Booking change: current details unavailable.");
      return "not_confirmed";
    }

    const previousBooking = bookingsResult.data?.find(
      (booking) => booking.id === change.old_booking_id,
    );

    const replacementBooking = bookingsResult.data?.find(
      (booking) => booking.id === change.new_booking_id,
    );

    if (!previousBooking || !replacementBooking) {
      console.error("Booking change: booking records unavailable.");
      return "not_confirmed";
    }

    const member = memberResult.data;
    const session = sessionResult.data;
    const snapshot = change.new_session_details;

    if (
      previousBooking.status !== "cancelled" ||
      replacementBooking.status !== "booked" ||
      member.status !== "active" ||
      session.status !== "published" ||
      Date.parse(session.starts_at) <= Date.now()
    ) {
      return recordOutcome("skipped");
    }

    const email = change.recipient_email.trim().toLowerCase();
    const currentEmail = String(member.email ?? "")
      .trim()
      .toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      email !== currentEmail
    ) {
      console.error("Booking change: recipient needs review.");
      return "not_confirmed";
    }

    // Do not send the saved message if the replacement details
    // have changed since the member moved their booking.
    if (
      previousBooking.session_id !==
        change.old_session_details.session_id ||
      replacementBooking.session_id !== snapshot.session_id ||
      session.session_number !== change.session_number ||
      !sameTime(session.starts_at, snapshot.starts_at) ||
      !sameTime(session.ends_at, snapshot.ends_at) ||
      String(session.venue_name ?? "") !== snapshot.venue_name ||
      String(session.venue_address ?? "") !==
        String(snapshot.venue_address ?? "")
    ) {
      console.error("Booking change: session details need review.");
      return "not_confirmed";
    }

    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM;

    if (!apiKey || !from) {
      console.error("Booking change: missing email configuration.");
      return "not_confirmed";
    }

    const message = buildBookingChangeEmail(
      {
        email,
        session_number: change.session_number,
        new_booking_id: change.new_booking_id,
        old_session_details: change.old_session_details,
        new_session_details: change.new_session_details,
      },
      from,
    );

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Idempotency-Key": `booking-change/${changeId}`,
      },
      body: JSON.stringify(message),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(
        "Booking change: provider returned status",
        response.status,
      );
      return "not_confirmed";
    }

    const result: { id?: string } = await response.json();

    if (typeof result.id !== "string" || !result.id.trim()) {
      return "not_confirmed";
    }

    return recordOutcome("accepted");
  } catch {
    console.error("Booking change: sending outcome not confirmed.");
    return "not_confirmed";
  }
}