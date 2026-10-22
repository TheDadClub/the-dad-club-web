"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/admin";
import {
  facilitatorApplicationStatuses,
} from "../../../lib/facilitatorApplications";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(data: FormData, field: string) {
  const value = data.get(field);
  return typeof value === "string" ? value.trim() : "";
}

function returnToApplications(
  formData: FormData,
  result: "saved" | "invalid" | "stale" | "save",
): never {
  const query = new URLSearchParams();

  const filter = text(formData, "filter");
  const validFilter = facilitatorApplicationStatuses.some(
    (item) => item.value === filter,
  );

  if (validFilter) {
    query.set("status", filter);
  }

  const page = Number(text(formData, "page"));

  if (
    Number.isSafeInteger(page) &&
    page > 1 &&
    page <= 100000
  ) {
    query.set("page", String(page));
  }

  if (result === "saved") {
    query.set("saved", "1");
  } else {
    query.set("error", result);
  }

  redirect(`/admin/facilitators?${query.toString()}`);
}

export async function saveApplicationStatus(formData: FormData) {
  // Verify the signed-in administrator before accessing applications.
  const { user, database } = await requireAdmin();

  const id = text(formData, "application_id");
  const status = text(formData, "status");
  const rawVersion = text(formData, "review_version");
  const version = Number(rawVersion);

  const valid =
    uuidPattern.test(id) &&
    facilitatorApplicationStatuses.some(
      (item) => item.value === status,
    ) &&
    /^\d+$/.test(rawVersion) &&
    Number.isSafeInteger(version) &&
    version >= 0 &&
    version < 2147483647;

  if (!valid) {
    returnToApplications(formData, "invalid");
  }

  let outcome: "saved" | "stale" | "save" = "save";

  try {
    const { data, error } = await database
      .from("facilitator_applications")
      .update({
        status,
        reviewed_by: user.id,
      })
      .eq("id", id)
      .eq("review_version", version)
      .neq("status", status)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error(
        "Facilitator application review failed:",
        error.code,
      );
    } else {
      outcome = data ? "saved" : "stale";
    }
  } catch {
    console.error(
      "Facilitator application review: database request failed.",
    );
  }

  if (outcome !== "save") {
    revalidatePath("/admin/facilitators");
  }

  returnToApplications(formData, outcome);
}