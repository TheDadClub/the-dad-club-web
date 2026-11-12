"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAuthClient } from "../../lib/supabase/server";
import { requireMember } from "../../lib/members";
import { sendBookingChange } from "../../lib/sendBookingChange";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const databaseErrors: Record<string, string> = {
  "Member sign-in required.": "access",
  "A verified email address is required.": "access",
  "Active member access is required.": "access",
  "This booking is no longer available to change.": "changed",
  "This booking changed. Please refresh and try again.": "changed",
  "Choose a different session date.": "same",
  "The original session has already started. Contact us to change.":
    "started",
  "Choose another date for the same session type.": "type",
  "Only published sessions can be booked.": "session",
  "The replacement session has already started.": "session",
  "This session has already started.": "session",
  "The replacement session could not be found.": "session",
  "This session is full.": "full",
  "This session entitlement is not available.": "entitlement",
  "The matching session entitlement is missing.": "entitlement",
};

function text(data: FormData, field: string) {
  const value = data.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function refreshPages() {
  revalidatePath("/members");
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/members");
  revalidatePath("/admin/sessions");
}

export async function rescheduleMemberBooking(formData: FormData) {
  const { member, database } = await requireMember();

  const bookingId = text(formData, "booking_id");
  const sessionId = text(formData, "session_id");

  if (
    !uuidPattern.test(bookingId) ||
    !uuidPattern.test(sessionId) ||
    formData.get("confirm_change") !== "yes"
  ) {
    redirect("/members?changeError=invalid#sessions");
  }

  let changeId: string | null = null;
  let errorCode = "unknown";

  try {
    const auth = await createAuthClient();

    // Ownership, capacity and both booking writes are checked
    // together inside the authenticated database transaction.
    const { data, error } = await auth.rpc(
      "reschedule_member_booking",
      {
        p_booking_id: bookingId,
        p_session_id: sessionId,
      },
    );

    if (error) {
      errorCode = databaseErrors[error.message] ?? "unknown";
      console.error("Member rescheduling failed:", error.code);
    } else if (
      typeof data === "string" &&
      uuidPattern.test(data)
    ) {
      changeId = data;
    }
  } catch {
    console.error("Member rescheduling: outcome unavailable.");
  }

  if (!changeId) {
    refreshPages();
    redirect(`/members?changeError=${errorCode}#sessions`);
  }

  let emailOutcome = "not_confirmed";

  try {
    // The helper also checks ownership before claiming the email.
    emailOutcome = await sendBookingChange(
      database,
      changeId,
      member.id,
    );
  } catch {
    // The saved move must not be undone by an email failure.
    console.error(
      "Member rescheduling: email outcome unavailable.",
    );
  }

  refreshPages();

  const query = new URLSearchParams({
    changed: changeId,
    changeEmail: emailOutcome,
  });

  redirect(`/members?${query.toString()}#sessions`);
}