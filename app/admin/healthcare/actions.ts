"use server";

import { Temporal } from "@js-temporal/polyfill";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../../../lib/admin";

const PATH = "/admin/healthcare";

const allowedStatuses = [
  "Not contacted",
  "Emailed",
  "Responded",
  "Interested",
  "Sharing resources",
  "Declined",
] as const;

const allowedPriorities = [
  "High",
  "Medium",
  "Low",
] as const;

function validateReferralId(referralId: string) {
  if (
    typeof referralId !== "string" ||
    !/^[0-9a-f]{8}-[1-9a-f0-9]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      referralId
    )
  ) {
    throw new Error("Invalid healthcare referral ID.");
  }
}

function isValidStatus(value: string) {
  return allowedStatuses.some(
    (status) => status === value
  );
}

function validateFollowUp(value: string | null) {
  if (value === null || value === "") {
    return null;
  }

  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    throw new Error("Invalid follow-up date.");
  }

  const date = Temporal.PlainDate.from(value);

  if (date.year < 2000 || date.year > 2100) {
    throw new Error("Invalid follow-up year.");
  }

  return date.toString();
}

export async function updateHealthcareStatus(
  referralId: string,
  newStatus: string,
  expectedStatus: string
) {
  const { database } = await requireAdmin();

  validateReferralId(referralId);

  if (
    !isValidStatus(newStatus) ||
    !isValidStatus(expectedStatus)
  ) {
    throw new Error("Invalid healthcare referral status.");
  }

  const { data, error } = await database
    .from("healthcare_referrals")
    .update({
      status: newStatus,
    })
    .eq("id", referralId)
    .eq("status", expectedStatus)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(
      "Unable to update healthcare referral."
    );
  }

  revalidatePath(PATH);

  if (!data) {
    return {
      success: false,
      message:
        "This status has changed. Review the latest status before saving again.",
    };
  }

  return {
    success: true,
    message: "Status updated.",
  };
}

export async function updateHealthcareNotes(
  referralId: string,
  notes: string,
  followUpAt: string | null
) {
  const { database } = await requireAdmin();

  validateReferralId(referralId);

  if (
    typeof notes !== "string" ||
    notes.length > 10000
  ) {
    throw new Error("Invalid notes.");
  }

  const followUp = validateFollowUp(followUpAt);

  const { data, error } = await database
    .from("healthcare_referrals")
    .update({
      notes: notes.trim() || null,
      follow_up_at: followUp,
    })
    .eq("id", referralId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      "Unable to save healthcare referral notes."
    );
  }

  revalidatePath(PATH);
}

export type NewHealthcareContact = {
  organisation_name: string;
  contact_name: string;
  category: string;
  email: string;
  phone: string;
  website: string;
  suburb: string;
  priority: string;
  notes: string;
};

function cleanField(
  value: unknown,
  maximumLength: number,
  label: string
): string {
  if (typeof value !== "string") {
    throw new Error(`Invalid ${label}.`);
  }

  const cleaned = value.trim();

  if (cleaned.length > maximumLength) {
    throw new Error(`${label} is too long.`);
  }

  return cleaned;
}

function validateContact(contact: NewHealthcareContact) {
  if (!contact || typeof contact !== "object") {
    throw new Error("Invalid healthcare contact.");
  }

  const organisationName = cleanField(
    contact.organisation_name,
    200,
    "Organisation name"
  );

  const email = cleanField(
    contact.email,
    254,
    "Email address"
  ).toLowerCase();

  if (!organisationName) {
    throw new Error(
      "A valid organisation name is required."
    );
  }

  if (
    email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    throw new Error(
      "Please enter a valid email address."
    );
  }

  if (
    !allowedPriorities.some(
      (priority) => priority === contact.priority
    )
  ) {
    throw new Error("Invalid priority.");
  }

  const website = cleanField(
    contact.website,
    500,
    "Website"
  );

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
        !url.hostname.includes(".") ||
        url.toString().length > 500
      ) {
        throw new Error("Invalid website.");
      }

      normalisedWebsite = url.toString();
    } catch {
      throw new Error("Invalid website.");
    }
  }

  return {
    organisation_name: organisationName,
    contact_name:
      cleanField(
        contact.contact_name,
        200,
        "Contact name"
      ) || null,
    category:
      cleanField(
        contact.category,
        150,
        "Category"
      ) || "Other",
    email: email || null,
    phone:
      cleanField(contact.phone, 50, "Phone") || null,
    website: normalisedWebsite,
    suburb:
      cleanField(contact.suburb, 150, "Suburb") || null,
    priority: contact.priority,
  };
}

export async function createHealthcareContact(
  contact: NewHealthcareContact
) {
  const { database } = await requireAdmin();

  const validated = validateContact(contact);

  const notes = cleanField(
    contact.notes,
    10000,
    "Notes"
  );

  const { error } = await database
    .from("healthcare_referrals")
    .insert({
      ...validated,
      notes: notes || null,
      state: "SA",
      status: "Not contacted",
    });

  if (error) {
    throw new Error(
      "Unable to create healthcare contact."
    );
  }

  revalidatePath(PATH);
}

export async function updateHealthcareContact(
  referralId: string,
  contact: NewHealthcareContact
) {
  const { database } = await requireAdmin();

  validateReferralId(referralId);

  const validated = validateContact(contact);

  const { data, error } = await database
    .from("healthcare_referrals")
    .update(validated)
    .eq("id", referralId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      "Unable to update healthcare contact."
    );
  }

  revalidatePath(PATH);
}

export async function deleteHealthcareContact(
  referralId: string
) {
  const { database } = await requireAdmin();

  validateReferralId(referralId);

  const { data, error } = await database
    .from("healthcare_referrals")
    .delete()
    .eq("id", referralId)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      "Unable to delete healthcare contact."
    );
  }

  revalidatePath(PATH);
}
