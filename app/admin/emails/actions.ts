
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "../../../lib/admin";
import {
  EMAIL_HEALTH_LABELS,
} from "../../../lib/emailHealthTypes";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function text(data: FormData, field: string) {
  const value = data.get(field);

  return typeof value === "string"
    ? value.trim()
    : "";
}

function returnToEmails(
  data: FormData,
  result: "saved" | "invalid" | "stale" | "save",
): never {
  const query = new URLSearchParams();

  const status = text(data, "filter_status");
  const severity = text(data, "filter_severity");
  const emailType = text(data, "filter_email_type");

  if (
    ["open", "acknowledged", "resolved", "all"].includes(
      status,
    )
  ) {
    query.set("status", status);
  }

  if (
    ["warning", "critical"].includes(severity)
  ) {
    query.set("severity", severity);
  }

  if (
    Object.prototype.hasOwnProperty.call(
      EMAIL_HEALTH_LABELS,
      emailType,
    )
  ) {
    query.set("email_type", emailType);
  }

  const page = Number(text(data, "page"));

  if (
    Number.isSafeInteger(page) &&
    page > 1 &&
    page <= 100000
  ) {
    query.set("page", String(page));
  }

  const alertPage = Number(
    text(data, "alert_page"),
  );

  if (
    Number.isSafeInteger(alertPage) &&
    alertPage > 1 &&
    alertPage <= 100000
  ) {
    query.set("alert_page", String(alertPage));
  }

  query.set(
    result === "saved" ? "saved" : "error",
    result,
  );

  redirect(
    `/admin/emails?${query.toString()}#email-issues`,
  );
}

export async function acknowledgeEmailHealthIssue(
  formData: FormData,
) {
  const { database } = await requireAdmin();

  const id = text(formData, "id");

  const rawOccurrence = text(
    formData,
    "occurrence_count",
  );

  const occurrence = Number(rawOccurrence);

  const lastDetectedAt = text(
    formData,
    "last_detected_at",
  );

  const valid =
    uuidPattern.test(id) &&
    /^\d+$/.test(rawOccurrence) &&
    Number.isSafeInteger(occurrence) &&
    occurrence >= 1 &&
    occurrence <= 2147483647 &&
    lastDetectedAt.length <= 64 &&
    Number.isFinite(Date.parse(lastDetectedAt));

  if (!valid) {
    returnToEmails(formData, "invalid");
  }

  let outcome: "saved" | "stale" | "save" =
    "save";

  try {
    const now = new Date().toISOString();

    const { data, error } = await database
      .from("email_health_issues")
      .update({
        status: "acknowledged",
        acknowledged_at: now,
        updated_at: now,
      })
      .eq("id", id)
      .eq("status", "open")
      .eq("occurrence_count", occurrence)
      .eq("last_detected_at", lastDetectedAt)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error(
        "Email health acknowledgement failed:",
        error.code,
      );
    } else {
      outcome = data ? "saved" : "stale";
    }
  } catch {
    console.error(
      "Email health acknowledgement request failed.",
    );
  }

  revalidatePath("/admin/emails");

  returnToEmails(formData, outcome);
}
