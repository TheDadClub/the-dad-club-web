
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EMAIL_HEALTH_THRESHOLDS,
  type DetectedEmailIssue,
  type EmailHealthType,
  type EmailHealthIssueType,
  type EmailHealthSeverity,
} from "./emailHealthTypes";

type SourceConfig = {
  emailType: EmailHealthType;
  table: string;
  idColumn: string;
  statusColumn: string;
  severity: EmailHealthSeverity;
  attemptColumn?: string;
  updatedColumn?: string;
  livePurchasesOnly?: boolean;
};

const sources: SourceConfig[] = [
  {
    emailType: "admin_notification",
    table: "admin_notifications",
    idColumn: "id",
    statusColumn: "status",
    severity: "warning",
    attemptColumn: "attempted_at",
    updatedColumn: "updated_at",
  },
  {
    emailType: "interest_confirmation",
    table: "interest_registrations",
    idColumn: "id",
    statusColumn: "confirmation_email_status",
    severity: "warning",
  },
  {
    emailType: "facilitator_acknowledgement",
    table: "facilitator_applications",
    idColumn: "id",
    statusColumn: "acknowledgement_email_status",
    severity: "warning",
  },
  {
    emailType: "venue_acknowledgement",
    table: "venue_partners",
    idColumn: "id",
    statusColumn: "acknowledgement_email_status",
    severity: "warning",
  },
  {
    emailType: "booking_confirmation",
    table: "booking_confirmation_emails",
    idColumn: "booking_id",
    statusColumn: "status",
    severity: "critical",
  },
  {
    emailType: "booking_cancellation",
    table: "booking_cancellation_emails",
    idColumn: "booking_id",
    statusColumn: "status",
    severity: "critical",
  },
  {
    emailType: "booking_change",
    table: "booking_changes",
    idColumn: "id",
    statusColumn: "email_status",
    severity: "critical",
  },
  {
    emailType: "purchase_confirmation",
    table: "purchase_confirmation_emails",
    idColumn: "order_id",
    statusColumn: "status",
    severity: "critical",
    livePurchasesOnly: true,
  },
];

const monitoredStatuses = [
  "failed",
  "not_confirmed",
  "pending",
  "processing",
];

const pageSize = 200;

function minutesSince(
  timestamp: unknown,
  now: number,
): number | null {
  if (typeof timestamp !== "string") {
    return null;
  }

  const parsed = Date.parse(timestamp);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return (now - parsed) / 60_000;
}

function classifyIssue(
  source: SourceConfig,
  row: Record<string, unknown>,
  now: number,
): EmailHealthIssueType | null {
  const status = row[source.statusColumn];

  const createdAge = minutesSince(
    row.created_at,
    now,
  );

  const attemptTimestamp = source.attemptColumn
    ? row[source.attemptColumn]
    : null;

  const updatedTimestamp = source.updatedColumn
    ? row[source.updatedColumn]
    : null;

  const attemptAge = minutesSince(
    attemptTimestamp ??
      updatedTimestamp ??
      row.created_at,
    now,
  );

  if (status === "failed") {
    return "failed";
  }

  if (
    status === "not_confirmed" &&
    attemptAge !== null &&
    attemptAge >=
      EMAIL_HEALTH_THRESHOLDS.unconfirmedGraceMinutes
  ) {
    return "not_confirmed";
  }

  if (
    status === "pending" &&
    createdAge !== null &&
    createdAge >=
      EMAIL_HEALTH_THRESHOLDS.pendingOverdueMinutes
  ) {
    return "pending_overdue";
  }

  if (
    status === "processing" &&
    attemptAge !== null &&
    attemptAge >=
      EMAIL_HEALTH_THRESHOLDS.pendingOverdueMinutes
  ) {
    return "processing_overdue";
  }

  return null;
}

async function isLivePurchase(
  database: SupabaseClient,
  orderId: string,
): Promise<boolean> {
  const { data, error } = await database
    .from("purchase_orders")
    .select("stripe_environment")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      "Email health: purchase environment unavailable.",
    );
  }

  return data.stripe_environment === "live";
}

async function detectSourceIssues(
  database: SupabaseClient,
  source: SourceConfig,
  monitoringStartedAt: string,
  now: number,
): Promise<DetectedEmailIssue[]> {
  const issues: DetectedEmailIssue[] = [];

  const columns = [
    source.idColumn,
    source.statusColumn,
    "created_at",
    source.attemptColumn,
    source.updatedColumn,
  ].filter(
    (column): column is string =>
      typeof column === "string",
  );

  const selectedColumns = [
    ...new Set(columns),
  ].join(",");

  let lastId: string | null = null;

  while (true) {
    let query = database
      .from(source.table)
      .select(selectedColumns)
      .gte("created_at", monitoringStartedAt)
      .lte("created_at", new Date(now).toISOString())
      .in(source.statusColumn, monitoredStatuses)
      .order(source.idColumn, {
        ascending: true,
      })
      .limit(pageSize);

    if (lastId !== null) {
      query = query.gt(
        source.idColumn,
        lastId,
      );
    }

    const { data, error } = await query;

    if (error || !Array.isArray(data)) {
      console.error(
        "Email health: source lookup failed.",
        source.table,
        error?.code,
      );

      throw new Error(
        `Email health lookup failed: ${source.table}`,
      );
    }

    const rows = data as unknown as Record<
      string,
      unknown
    >[];

    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      const sourceId = row[source.idColumn];
      const sourceStatus = row[source.statusColumn];

      if (
        typeof sourceId !== "string" ||
        typeof sourceStatus !== "string"
      ) {
        throw new Error(
          `Email health: invalid source record in ${source.table}`,
        );
      }

      const issueType = classifyIssue(
        source,
        row,
        now,
      );

      if (!issueType) {
        continue;
      }

      if (source.livePurchasesOnly) {
        const live = await isLivePurchase(
          database,
          sourceId,
        );

        if (!live) {
          continue;
        }
      }

      issues.push({
        issue_key:
          `${source.emailType}:${sourceId}`,

        email_type: source.emailType,
        source_table: source.table,
        source_id: sourceId,
        issue_type: issueType,
        severity: source.severity,
        source_status: sourceStatus,
        error_code: null,
      });
    }

    const nextId =
      rows[rows.length - 1][source.idColumn];

    if (
      typeof nextId !== "string" ||
      nextId === lastId
    ) {
      throw new Error(
        "Email health: pagination could not advance.",
      );
    }

    lastId = nextId;

    if (rows.length < pageSize) {
      break;
    }
  }

  return issues;
}

export async function detectImmediateEmailIssues(
  database: SupabaseClient,
  monitoringStartedAt: string,
  now = Date.now(),
): Promise<DetectedEmailIssue[]> {
  const startedAt = Date.parse(
    monitoringStartedAt,
  );

  if (
    !Number.isFinite(startedAt) ||
    !Number.isFinite(now) ||
    startedAt > now
  ) {
    throw new Error(
      "Email health: invalid monitoring timestamps.",
    );
  }

  const issues: DetectedEmailIssue[] = [];

  for (const source of sources) {
    const detected = await detectSourceIssues(
      database,
      source,
      monitoringStartedAt,
      now,
    );

    issues.push(...detected);
  }

  return issues;
}
