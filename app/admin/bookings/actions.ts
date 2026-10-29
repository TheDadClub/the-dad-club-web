"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/admin";
import { sendBookingConfirmation } from "../../../lib/sendBookingConfirmation";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const databaseErrors: Record<string, string> = {
  "Only active members can be booked.": "member",
  "Only published sessions can be booked.": "session",
  "This session has already started.": "started",
  "This session entitlement is not available.": "entitlement",
  "The matching session entitlement is missing.": "entitlement",
  "This member already has a booking for this session type.": "duplicate",
  "This session is full.": "full",
  "Attendance can be recorded once the session starts.": "early",
  "Attendance requires a published session.": "session",
  "This booking is already completed or cancelled.": "changed",
};

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function fail(code: string): never {
  redirect(`/admin/bookings?error=${encodeURIComponent(code)}`);
}

function refreshAdmin() {
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/members");
  revalidatePath("/admin/sessions");
}

export async function createBooking(formData: FormData) {
  const { user, database } = await requireAdmin();

  const memberId = field(formData, "member_id");
  const sessionId = field(formData, "session_id");

  if (!uuidPattern.test(memberId) || !uuidPattern.test(sessionId)) {
    fail("invalid");
  }

  const bookingId = randomUUID();
  let errorCode: string | null = null;

  try {
    const { error } = await database.from("session_bookings").insert({
      id: bookingId,
      member_id: memberId,
      session_id: sessionId,
      // The database replaces this with the selected session's type.
      session_number: 1,
      status: "booked",
      created_by: user.id,
      updated_by: user.id,
    });

    if (error) {
      errorCode =
        error.code === "23505"
          ? "duplicate"
          : databaseErrors[error.message] ?? "save";

      console.error("Booking creation failed:", error.code);
    }
  } catch {
    errorCode = "save";
    console.error("Booking creation failed.");
  }

  if (errorCode) {
    fail(errorCode);
  }

  // The booking has been saved. Email failure must not undo it.
  let emailOutcome = "not_confirmed";

  try {
    emailOutcome = await sendBookingConfirmation(database, bookingId);
  } catch {
    console.error(
      "Booking saved; confirmation email outcome unavailable.",
    );
  }

  refreshAdmin();

  redirect(
    `/admin/bookings?saved=created&email=${encodeURIComponent(emailOutcome)}`,
  );
}

export async function updateBooking(formData: FormData) {
  const { user, database } = await requireAdmin();

  const id = field(formData, "id");
  const status = field(formData, "status");

  if (
    !uuidPattern.test(id) ||
    !["attended", "cancelled"].includes(status)
  ) {
    fail("invalid");
  }

  let errorCode: string | null = null;

  try {
    const { data, error } = await database
      .from("session_bookings")
      .update({
        status,
        updated_by: user.id,
      })
      .eq("id", id)
      .eq("status", "booked")
      .select("id")
      .maybeSingle();

    if (error) {
      errorCode = databaseErrors[error.message] ?? "save";
      console.error("Booking update failed:", error.code);
    } else if (!data) {
      errorCode = "changed";
    }
  } catch {
    errorCode = "save";
    console.error("Booking update failed.");
  }

  if (errorCode) {
    fail(errorCode);
  }

  refreshAdmin();
  redirect(`/admin/bookings?saved=${status}`);
}