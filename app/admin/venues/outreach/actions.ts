"use server";

import { Temporal } from "@js-temporal/polyfill";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../../lib/admin";

import {
  isVenueOutreachStatus,
  isVenueOutreachPriority,
  isAustralianState,
} from "../../../../lib/venueOutreach";

const PATH = "/admin/venues/outreach";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ActionResult = {
  success: boolean;
  message: string;
};

function text(
  data: FormData,
  field: string
): string {
  const value = data.get(field);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function failure(message: string): ActionResult {
  return {
    success: false,
    message,
  };
}

function success(message: string): ActionResult {
  revalidatePath(PATH);

  return {
    success: true,
    message,
  };
}

function parseContact(formData: FormData) {
  const venueName = text(formData, "venue_name");
  const contactName = text(formData, "contact_name");
  const email = text(formData, "email").toLowerCase();
  const phone = text(formData, "phone");
  const website = text(formData, "website");
  const suburb = text(formData, "suburb");
  const state = text(formData, "state");
  const priority = text(formData, "priority");

  if (
    !venueName ||
    venueName.length > 150 ||
    contactName.length > 150 ||
    !EMAIL_PATTERN.test(email) ||
    email.length > 254 ||
    phone.length > 50 ||
    website.length > 500 ||
    suburb.length > 150 ||
    !isAustralianState(state) ||
    !isVenueOutreachPriority(priority)
  ) {
    return null;
  }

  let normalisedWebsite: string | null = null;

  if (website) {
    try {
      const url = new URL(
        /^https?:\/\//i.test(website)
          ? website
          : `https://${website}`
      );

      if (
        !["http:", "https:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        !url.hostname.includes(".")
      ) {
        return null;
      }

      normalisedWebsite = url.toString();

      if (normalisedWebsite.length > 500) {
        return null;
      }
    } catch {
      return null;
    }
  }

  return {
    venue_name: venueName,
    contact_name: contactName || null,
    email,
    phone: phone || null,
    website: normalisedWebsite,
    suburb: suburb || null,
    state,
    priority,
  };
}

function parseFollowUp(
  value: string
): string | null {
  if (!value) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Invalid follow-up date.");
  }

  const date = Temporal.PlainDate.from(value);

  if (date.year < 2000 || date.year > 2100) {
    throw new Error("Invalid follow-up year.");
  }

  return date
    .toPlainDateTime("09:00")
    .toZonedDateTime("Australia/Adelaide")
    .toInstant()
    .toString();
}

export async function addVenueOutreachContact(
  formData: FormData
): Promise<ActionResult> {
  const { database } = await requireAdmin();

  const contact = parseContact(formData);
  const notes = text(formData, "notes");

  if (!contact || notes.length > 5000) {
    return failure(
      "Please check the contact details."
    );
  }

  let followUpAt: string | null;

  try {
    followUpAt = parseFollowUp(
      text(formData, "follow_up_date")
    );
  } catch {
    return failure(
      "Please enter a valid follow-up date."
    );
  }

  const { error } = await database
    .from("venue_outreach_contacts")
    .insert({
      ...contact,
      status: "Not contacted",
      notes: notes || null,
      follow_up_at: followUpAt,
    });

  if (error) {
    if (error.code === "23505") {
      return failure(
        "A venue contact with this email address already exists."
      );
    }

    console.error(
      "Venue outreach creation failed:",
      error.code
    );

    return failure(
      "Unable to create the venue contact."
    );
  }

  return success("Venue contact added.");
}

export async function updateVenueOutreachContact(
  formData: FormData
): Promise<ActionResult> {
  const { database } = await requireAdmin();

  const id = text(formData, "id");
  const expectedUpdatedAt = text(
    formData,
    "updated_at"
  );

  const contact = parseContact(formData);

  if (
    !UUID_PATTERN.test(id) ||
    !contact ||
    !expectedUpdatedAt ||
    !Number.isFinite(Date.parse(expectedUpdatedAt))
  ) {
    return failure(
      "Invalid contact details. Refresh and try again."
    );
  }

  const { data, error } = await database
    .from("venue_outreach_contacts")
    .update({
      ...contact,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("updated_at", expectedUpdatedAt)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return failure(
        "Another venue contact already uses this email address."
      );
    }

    console.error(
      "Venue outreach update failed:",
      error.code
    );

    return failure(
      "Unable to update the venue contact."
    );
  }

  if (!data) {
    revalidatePath(PATH);

    return failure(
      "This contact has changed. Review the latest details before saving again."
    );
  }

  return success("Venue contact updated.");
}

export async function updateVenueOutreachStatus(
  formData: FormData
): Promise<ActionResult> {
  const { database } = await requireAdmin();

  const id = text(formData, "id");
  const status = text(formData, "status");
  const expectedUpdatedAt = text(
    formData,
    "updated_at"
  );

  if (
    !UUID_PATTERN.test(id) ||
    !isVenueOutreachStatus(status) ||
    !expectedUpdatedAt ||
    !Number.isFinite(Date.parse(expectedUpdatedAt))
  ) {
    return failure("Invalid venue status.");
  }

  const { data, error } = await database
    .from("venue_outreach_contacts")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("updated_at", expectedUpdatedAt)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(
      "Venue outreach status update failed:",
      error.code
    );

    return failure(
      "Unable to update the venue status."
    );
  }

  if (!data) {
    revalidatePath(PATH);

    return failure(
      "The venue record has changed. Review its latest status before saving."
    );
  }

  return success("Venue status updated.");
}

export async function updateVenueOutreachNotes(
  formData: FormData
): Promise<ActionResult> {
  const { database } = await requireAdmin();

  const id = text(formData, "id");
  const notes = text(formData, "notes");
  const expectedUpdatedAt = text(
    formData,
    "updated_at"
  );

  if (
    !UUID_PATTERN.test(id) ||
    notes.length > 5000 ||
    !expectedUpdatedAt ||
    !Number.isFinite(Date.parse(expectedUpdatedAt))
  ) {
    return failure(
      "Please check the notes and contact details."
    );
  }

  let followUpAt: string | null;

  try {
    followUpAt = parseFollowUp(
      text(formData, "follow_up_date")
    );
  } catch {
    return failure(
      "Please enter a valid follow-up date."
    );
  }

  const { data, error } = await database
    .from("venue_outreach_contacts")
    .update({
      notes: notes || null,
      follow_up_at: followUpAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("updated_at", expectedUpdatedAt)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error(
      "Venue outreach notes update failed:",
      error.code
    );

    return failure(
      "Unable to save notes and follow-up."
    );
  }

  if (!data) {
    revalidatePath(PATH);

    return failure(
      "This contact has changed. Review the latest details before saving again."
    );
  }

  return success("Notes and follow-up saved.");
}
