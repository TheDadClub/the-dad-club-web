
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { EmailHealthType } from "./emailHealthTypes";

type ExistingIssue = {
  id: string;
  email_type: EmailHealthType;
  source_id: string;
  status: string;
  last_detected_at: string;
  occurrence_count: number;
};

type RecoverySource = {
  table: string;
  idColumn: string;
  statusColumn: string;
  recoveredStatuses: string[];
};

const recoverySources: Partial<
  Record<EmailHealthType, RecoverySource>
> = {
  admin_notification: {
    table: "admin_notifications",
    idColumn: "id",
    statusColumn: "status",
    recoveredStatuses: ["accepted"],
  },
  interest_confirmation: {
    table: "interest_registrations",
    idColumn: "id",
    statusColumn: "confirmation_email_status",
    recoveredStatuses: ["sent"],
  },
  facilitator_acknowledgement: {
    table: "facilitator_applications",
    idColumn: "id",
    statusColumn: "acknowledgement_email_status",
    recoveredStatuses: ["accepted"],
  },
  venue_acknowledgement: {
    table: "venue_partners",
    idColumn: "id",
    statusColumn: "acknowledgement_email_status",
    recoveredStatuses: ["accepted"],
  },
  booking_confirmation: {
    table: "booking_confirmation_emails",
    idColumn: "booking_id",
    statusColumn: "status",
    recoveredStatuses: ["accepted", "skipped"],
  },
  booking_cancellation: {
    table: "booking_cancellation_emails",
    idColumn: "booking_id",
    statusColumn: "status",
    recoveredStatuses: ["accepted", "skipped"],
  },
  booking_change: {
    table: "booking_changes",
    idColumn: "id",
    statusColumn: "email_status",
    recoveredStatuses: ["accepted", "skipped"],
  },
  purchase_confirmation: {
    table: "purchase_confirmation_emails",
    idColumn: "order_id",
    statusColumn: "status",
    recoveredStatuses: ["accepted", "skipped"],
  },
  session_reminder: {
    table: "session_reminder_queue",
    idColumn: "id",
    statusColumn: "status",
    recoveredStatuses: ["accepted", "skipped"],
  },
  waitlist_notification: {
    table: "waitlist_email_queue",
    idColumn: "id",
    statusColumn: "status",
    recoveredStatuses: ["accepted", "skipped"],
  },
};

async function checkRecovery(
  database: SupabaseClient,
  issue: ExistingIssue,
): Promise<string | null> {
  if (issue.email_type === "scheduled_processor") {
    const { data, error } = await database
      .from("email_processor_health")
      .select("last_status,last_success_at")
      .eq("processor_name", issue.source_id)
      .maybeSingle();

    if (error) {
      throw new Error(
        "Email health: processor recovery lookup failed.",
      );
    }

    if (
      !data ||
      data.last_status !== "success" ||
      !data.last_success_at
    ) {
      return null;
    }

    const successTime = Date.parse(
      data.last_success_at,
    );

    const detectionTime = Date.parse(
      issue.last_detected_at,
    );

    return successTime > detectionTime
      ? "success"
      : null;
  }

  const source = recoverySources[issue.email_type];

  if (!source) {
    return null;
  }

  const { data, error } = await database
    .from(source.table)
    .select(source.statusColumn)
    .eq(source.idColumn, issue.source_id)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Email health: recovery lookup failed for ${source.table}.`,
    );
  }

  if (!data) {
    // A missing record is not proof of recovery.
    return null;
  }

  const record = data as unknown as Record<
    string,
    unknown
  >;

  const status = record[source.statusColumn];

  if (
    typeof status === "string" &&
    source.recoveredStatuses.includes(status)
  ) {
    return status;
  }

  return null;
}

export async function resolveEmailHealthIssues(
  database: SupabaseClient,
): Promise<number> {
  let resolved = 0;
  let lastId: string | null = null;

  const pageSize = 200;

  while (true) {
    let query = database
      .from("email_health_issues")
      .select(
        "id,email_type,source_id,status,last_detected_at,occurrence_count",
      )
      .in("status", ["open", "acknowledged"])
      .order("id", { ascending: true })
      .limit(pageSize);

    if (lastId !== null) {
      query = query.gt("id", lastId);
    }

    const { data, error } = await query;

    if (error || !Array.isArray(data)) {
      throw new Error(
        "Email health: unresolved issues unavailable.",
      );
    }

    const issues = data as ExistingIssue[];

    if (issues.length === 0) {
      break;
    }

    for (const issue of issues) {
      const recoveredStatus = await checkRecovery(
        database,
        issue,
      );

      if (!recoveredStatus) {
        continue;
      }

      const resolvedAt = new Date().toISOString();

      const { data: updated, error: updateError } =
        await database
          .from("email_health_issues")
          .update({
            status: "resolved",
            source_status: recoveredStatus,
            resolved_at: resolvedAt,
            updated_at: resolvedAt,
          })
          .eq("id", issue.id)
          .eq("occurrence_count", issue.occurrence_count)
          .eq("last_detected_at", issue.last_detected_at)
          .in("status", ["open", "acknowledged"])
          .select("id")
          .maybeSingle();

      if (updateError) {
        throw new Error(
          "Email health: issue resolution failed.",
        );
      }

      if (updated) {
        resolved += 1;
      }
    }

    const nextId = issues[issues.length - 1].id;

    if (nextId === lastId) {
      throw new Error(
        "Email health: resolution pagination failed.",
      );
    }

    lastId = nextId;

    if (issues.length < pageSize) {
      break;
    }
  }

  return resolved;
}
