"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAuthClient } from "../../lib/supabase/server";
import { requireMember } from "../../lib/members";
import { sendBookingConfirmation } from "../../lib/sendBookingConfirmation";
import { sendBookingCancellation } from "../../lib/sendBookingCancellation";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const databaseErrors: Record<string, string> = {
  "Only active members can be booked.": "access",
  "Only published sessions can be booked.": "session",
  "This session has already started.": "started",
  "This session entitlement is not available.": "entitlement",
  "The matching session entitlement is missing.": "entitlement",
  "This member already has a booking for this session type.": "duplicate",
  "This session is full.": "full",
};

const cancellationErrors: Record<string, string> = {
  "Member sign-in required.": "access",
  "A verified email address is required.": "access",
  "Active member access is required.": "access",
  "This booking is not available to your account.": "changed",
  "This booking is no longer available to cancel.": "changed",
  "This booking is already completed or cancelled.": "changed",
  "This session has already started. Contact us to cancel.": "started",
  "The matching session entitlement is missing.": "support",
  "Session not found.": "support",
};

function refreshPages() {
  revalidatePath("/members");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/members");
  revalidatePath("/admin/sessions");
}

export async function bookMemberSession(formData: FormData) {
  const { member, database } = await requireMember();

  const value = formData.get("session_id");
  const sessionId = typeof value === "string" ? value.trim() : "";

  if (!uuidPattern.test(sessionId)) {
    redirect("/members?error=invalid#sessions");
  }

  let bookingId: string | null = null;
  let errorCode = "";

  try {
    const auth = await createAuthClient();

    const { data, error } = await auth.rpc("book_member_session", {
      p_session_id: sessionId,
    });

    if (error) {
      errorCode =
        error.code === "23505"
          ? "duplicate"
          : databaseErrors[error.message] ?? "unknown";

      console.error("Member booking failed:", error.code);
    } else if (typeof data === "string" && uuidPattern.test(data)) {
      bookingId = data;
    } else {
      errorCode = "unknown";
    }
  } catch {
    errorCode = "unknown";
    console.error("Member booking: outcome unavailable.");
  }

  if (!bookingId) {
    refreshPages();
    redirect(`/members?error=${errorCode || "unknown"}#sessions`);
  }

  let emailOutcome = "not_confirmed";

  try {
    const { data: booking, error } = await database
      .from("session_bookings")
      .select("id")
      .eq("id", bookingId)
      .eq("member_id", member.id)
      .maybeSingle();

    if (!error && booking) {
      emailOutcome = await sendBookingConfirmation(
        database,
        bookingId,
      );
    } else {
      console.error("Member booking: email ownership check failed.");
    }
  } catch {
    console.error("Member booking: confirmation outcome unavailable.");
  }

  refreshPages();

  const query = new URLSearchParams({
    booking: bookingId,
    email: emailOutcome,
  });

  redirect(`/members?${query.toString()}#sessions`);
}

export async function cancelMemberBooking(formData: FormData) {
  const { member, database } = await requireMember();

  const value = formData.get("booking_id");
  const bookingId = typeof value === "string" ? value.trim() : "";

  if (
    !uuidPattern.test(bookingId) ||
    formData.get("confirm_cancellation") !== "yes"
  ) {
    redirect("/members?cancelError=invalid#sessions");
  }

  let cancelledId: string | null = null;
  let errorCode = "unknown";

  try {
    const auth = await createAuthClient();

    // The database identifies the member from the signed-in user.
    // No member ID or administrator identity is accepted from the form.
    const { data, error } = await auth.rpc("cancel_member_booking", {
      p_booking_id: bookingId,
    });

    if (error) {
      errorCode = cancellationErrors[error.message] ?? "unknown";
      console.error("Member cancellation failed:", error.code);
    } else if (
      typeof data === "string" &&
      uuidPattern.test(data) &&
      data === bookingId
    ) {
      cancelledId = data;
    }
  } catch {
    console.error("Member cancellation: outcome unavailable.");
  }

  if (!cancelledId) {
    refreshPages();
    redirect(`/members?cancelError=${errorCode}#sessions`);
  }

  let emailOutcome = "not_confirmed";

  try {
    // Verify ownership and saved cancellation before using
    // the server-only email helper.
    const { data: booking, error } = await database
      .from("session_bookings")
      .select("id")
      .eq("id", cancelledId)
      .eq("member_id", member.id)
      .eq("status", "cancelled")
      .maybeSingle();

    if (!error && booking) {
      emailOutcome = await sendBookingCancellation(
        database,
        cancelledId,
      );
    } else {
      console.error(
        "Member cancellation: email ownership check failed.",
      );
    }
  } catch {
    // Email failure must never undo a saved cancellation.
    console.error(
      "Member cancellation: email outcome unavailable.",
    );
  }

  refreshPages();

  const query = new URLSearchParams({
    cancelled: cancelledId,
    cancellationEmail: emailOutcome,
  });

  redirect(`/members?${query.toString()}#sessions`);
}