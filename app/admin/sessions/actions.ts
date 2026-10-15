"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/admin";
import {
  adelaideInputToUTC,
  sessionStatuses,
  sessionTimeZone,
} from "../../../lib/programSessions";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(data: FormData, field: string): string {
  const value = data.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function returnWithError(code: string, id: string): never {
  const query = new URLSearchParams({ error: code });

  if (id && uuidPattern.test(id)) {
    query.set("edit", id);
  }

  redirect(`/admin/sessions?${query.toString()}#session-form`);
}

function parseSessionTimes(
  startValue: string,
  endValue: string,
): { startsAt: string; endsAt: string } | null {
  try {
    const startsAt = adelaideInputToUTC(startValue);
    const endsAt = adelaideInputToUTC(endValue);

    if (Date.parse(endsAt) <= Date.parse(startsAt)) {
      return null;
    }

    return { startsAt, endsAt };
  } catch {
    return null;
  }
}

export async function saveSession(formData: FormData) {
  const { user, database } = await requireAdmin();

  const id = text(formData, "id");
  const sessionNumber = Number(text(formData, "session_number"));
  const capacity = Number(text(formData, "capacity"));
  const venueName = text(formData, "venue_name");
  const venueAddress = text(formData, "venue_address");
  const status = text(formData, "status");
  const adminNotes = text(formData, "admin_notes");

  const valid =
    (!id || uuidPattern.test(id)) &&
    Number.isInteger(sessionNumber) &&
    sessionNumber >= 1 &&
    sessionNumber <= 5 &&
    Number.isInteger(capacity) &&
    capacity >= 1 &&
    capacity <= 200 &&
    venueName.length >= 1 &&
    venueName.length <= 150 &&
    venueAddress.length >= 1 &&
    venueAddress.length <= 300 &&
    sessionStatuses.some((allowed) => allowed === status) &&
    adminNotes.length <= 2000;

  if (!valid) {
    returnWithError("invalid", id);
  }

  const times = parseSessionTimes(
    text(formData, "starts_at"),
    text(formData, "ends_at"),
  );

  if (!times) {
    returnWithError("times", id);
  }

  const values = {
    session_number: sessionNumber,
    starts_at: times.startsAt,
    ends_at: times.endsAt,
    time_zone: sessionTimeZone,
    venue_name: venueName,
    venue_address: venueAddress,
    capacity,
    status,
    admin_notes: adminNotes,
  };

  let saved = false;

  try {
    if (id) {
      const { data, error } = await database
        .from("program_sessions")
        .update(values)
        .eq("id", id)
        .select("id")
        .maybeSingle();

      saved = !error && Boolean(data);

      if (error) {
        console.error("Session update failed:", error.code);
      }
    } else {
      const { error } = await database
        .from("program_sessions")
        .insert({
          ...values,
          created_by: user.id,
        });

      saved = !error;

      if (error) {
        console.error("Session creation failed:", error.code);
      }
    }
  } catch {
    console.error("Session save: database request failed.");
  }

  if (!saved) {
    returnWithError("save", id);
  }

  revalidatePath("/admin/sessions");
  redirect("/admin/sessions?saved=1");
}