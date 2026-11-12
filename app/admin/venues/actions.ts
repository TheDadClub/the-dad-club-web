"use server";

import { Temporal } from "@js-temporal/polyfill";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/admin";
import { venueReviewStatuses } from "../../../lib/venueReviews";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(data: FormData, field: string) {
  const value = data.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function returnToVenues(
  data: FormData,
  result: "saved" | "invalid" | "stale" | "save",
): never {
  const query = new URLSearchParams();
  const page = Number(text(data, "page"));

  if (Number.isSafeInteger(page) && page > 1 && page <= 100000) {
    query.set("page", String(page));
  }

  query.set(result === "saved" ? "saved" : "error", result);

  const id = text(data, "id");
  const anchor = uuidPattern.test(id) ? `#venue-${id}` : "";

  redirect(`/admin/venues?${query.toString()}${anchor}`);
}

export async function saveVenueReview(formData: FormData) {
  const { database } = await requireAdmin();

  const id = text(formData, "id");
  const status = text(formData, "status");
  const notes = text(formData, "internal_notes");
  const followUp = text(formData, "follow_up_date");
  const rawVersion = text(formData, "review_version");
  const version = Number(rawVersion);

  const valid =
    uuidPattern.test(id) &&
    venueReviewStatuses.some((item) => item.value === status) &&
    notes.length <= 5000 &&
    /^\d+$/.test(rawVersion) &&
    Number.isSafeInteger(version) &&
    version >= 0 &&
    version < 2147483647;

  if (!valid) {
    returnToVenues(formData, "invalid");
  }

  let followUpAt: string | null = null;

  if (followUp) {
    try {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(followUp)) {
        throw new Error("Invalid date.");
      }

      const date = Temporal.PlainDate.from(followUp);

      if (date.year < 2000 || date.year > 2100) {
        throw new Error("Invalid year.");
      }

      followUpAt = date
        .toPlainDateTime("09:00")
        .toZonedDateTime("Australia/Adelaide")
        .toInstant()
        .toString();
    } catch {
      returnToVenues(formData, "invalid");
    }
  }

  let outcome: "saved" | "stale" | "save" = "save";

  try {
    const { data, error } = await database
      .from("venue_partners")
      .update({
        status,
        internal_notes: notes || null,
        follow_up_at: followUpAt,
      })
      .eq("id", id)
      .eq("review_version", version)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Venue review save failed:", error.code);
    } else {
      outcome = data ? "saved" : "stale";
    }
  } catch {
    console.error("Venue review database request failed.");
  }

  revalidatePath("/admin/venues");
  returnToVenues(formData, outcome);
}