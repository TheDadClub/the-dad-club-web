"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAuthClient } from "../../lib/supabase/server";
import { requireMember } from "../../lib/members";
import { sendBookingConfirmation } from "../../lib/sendBookingConfirmation";

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

    // The authenticated database function determines the member.
    // A member ID is never accepted from the submitted form.
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
    // Check ownership before using the server-only email helper.
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
    // The booking remains saved if email delivery fails.
    console.error("Member booking: confirmation outcome unavailable.");
  }

  refreshPages();

  const query = new URLSearchParams({
    booking: bookingId,
    email: emailOutcome,
  });

  redirect(`/members?${query.toString()}#sessions`);
}