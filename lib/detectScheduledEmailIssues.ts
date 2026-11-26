
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EMAIL_HEALTH_THRESHOLDS,
  type DetectedEmailIssue,
  type EmailHealthIssueType,
  type ProcessorName,
} from "./emailHealthTypes";

type QueueConfig = {
  table: string;
  emailType:
    | "session_reminder"
    | "waitlist_notification";
  enabled: boolean;
};

type QueueRecord = {
  id: string;
  status: string;
  created_at: string;
  updated_at: string;
  next_attempt_at: string;
  lease_expires_at: string | null;
  last_error_code: string | null;
  scheduled_for?: string;
};

type ProcessorRecord = {
  processor_name: ProcessorName;
  last_status: string;
  last_started_at: string | null;
  last_finished_at: string | null;
  last_success_at: string | null;
  last_error_code: string | null;
};

const pageSize = 200;

function ageMinutes(
  timestamp: string | null | undefined,
  now: number,
): number | null {
  if (!timestamp) {
    return null;
  }

  const parsed = Date.parse(timestamp);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return (now - parsed) / 60_000;
}

function classifyQueueIssue(
  source: QueueConfig,
  row: QueueRecord,
  now: number,
): EmailHealthIssueType | null {
  // Explicit review outcomes require attention,
  // even if scheduled processing is disabled.
  if (row.status === "review") {
    return "review_required";
  }

  if (!source.enabled) {
    return null;
  }

  if (row.status === "processing") {
    const expiredMinutes = ageMinutes(
      row.lease_expires_at,
      now,
    );

    if (
      expiredMinutes !== null &&
      expiredMinutes >=
        EMAIL_HEALTH_THRESHOLDS.expiredLeaseGraceMinutes
    ) {
      return "processing_overdue";
    }

    return null;
  }

  if (row.status !== "queued") {
    return null;
  }

  // Waitlist eligibility depends on current capacity,
  // entitlements and booking status.
  // Do not infer a failure from queue age alone.
  if (source.emailType === "waitlist_notification") {
    return null;
  }

  // A reminder must be both scheduled and eligible
  // for its next attempt before it can be overdue.
  const nextAttempt = Date.parse(
    row.next_attempt_at,
  );

  const scheduledFor = Date.parse(
    row.scheduled_for ?? "",
  );

  if (
    !Number.isFinite(nextAttempt) ||
    !Number.isFinite(scheduledFor)
  ) {
    throw new Error(
      "Email health: invalid reminder timestamps.",
    );
  }

  const eligibleAt = Math.max(
    nextAttempt,
    scheduledFor,
  );

  const overdueMinutes =
    (now - eligibleAt) / 60_000;

  if (
    overdueMinutes >=
    EMAIL_HEALTH_THRESHOLDS.queueOverdueMinutes
  ) {
    return "queue_overdue";
  }

  return null;
}

async function detectQueueIssues(
  database: SupabaseClient,
  source: QueueConfig,
  monitoringStartedAt: string,
  now: number,
): Promise<DetectedEmailIssue[]> {
  const issues: DetectedEmailIssue[] = [];

  const columns = [
    "id",
    "status",
    "created_at",
    "updated_at",
    "next_attempt_at",
    "lease_expires_at",
    "last_error_code",
  ];

  if (source.emailType === "session_reminder") {
    columns.push("scheduled_for");
  }

  let lastId: string | null = null;

  while (true) {
    let query = database
      .from(source.table)
      .select(columns.join(","))
      .gte("created_at", monitoringStartedAt)
      .lte("created_at", new Date(now).toISOString())
      .in("status", [
        "queued",
        "processing",
        "review",
      ])
      .order("id", {
        ascending: true,
      })
      .limit(pageSize);

    if (lastId !== null) {
      query = query.gt("id", lastId);
    }

    const { data, error } = await query;

    if (error || !Array.isArray(data)) {
      console.error(
        "Email health: queue lookup failed.",
        source.table,
        error?.code,
      );

      throw new Error(
        `Email health queue lookup failed: ${source.table}`,
      );
    }

    const rows = data as unknown as QueueRecord[];

    if (rows.length === 0) {
      break;
    }

    for (const row of rows) {
      if (typeof row.id !== "string") {
        throw new Error(
          "Email health: invalid queue reference.",
        );
      }

      const issueType = classifyQueueIssue(
        source,
        row,
        now,
      );

      if (!issueType) {
        continue;
      }

      issues.push({
        issue_key:
          `${source.emailType}:${row.id}`,

        email_type: source.emailType,
        source_table: source.table,
        source_id: row.id,
        issue_type: issueType,

        severity:
          source.emailType === "session_reminder"
            ? "critical"
            : "warning",

        source_status: row.status,
        error_code: row.last_error_code,
      });
    }

    const nextId = rows[rows.length - 1].id;

    if (
      typeof nextId !== "string" ||
      nextId === lastId
    ) {
      throw new Error(
        "Email health: queue pagination failed.",
      );
    }

    lastId = nextId;

    if (rows.length < pageSize) {
      break;
    }
  }

  return issues;
}

async function detectProcessorIssues(
  database: SupabaseClient,
  monitoringStartedAt: string,
  now: number,
): Promise<DetectedEmailIssue[]> {
  const processors = [
    {
      name: "session_reminders",
      enabled:
        process.env.SESSION_REMINDERS_ENABLED === "true",
    },
    {
      name: "waitlist_notifications",
      enabled:
        process.env.WAITLIST_EMAILS_ENABLED === "true",
    },
  ] as const;

  const issues: DetectedEmailIssue[] = [];

  const { data, error } = await database
    .from("email_processor_health")
    .select(
      "processor_name,last_status,last_started_at,last_finished_at,last_success_at,last_error_code",
    )
    .in("processor_name", [
      "session_reminders",
      "waitlist_notifications",
    ]);

  if (error || !Array.isArray(data)) {
    throw new Error(
      "Email health: processor health unavailable.",
    );
  }

  const rows = data as ProcessorRecord[];

  for (const processor of processors) {
    if (!processor.enabled) {
      continue;
    }

    const row = rows.find(
      (record) =>
        record.processor_name === processor.name,
    );

    if (!row) {
      throw new Error(
        "Email health: processor record missing.",
      );
    }

    const activationTime = Date.parse(
      monitoringStartedAt,
    );

    const lastStarted = Date.parse(
      row.last_started_at ?? "",
    );

    const referenceTime = Math.max(
      activationTime,
      Number.isFinite(lastStarted)
        ? lastStarted
        : activationTime,
    );

    const inactiveMinutes =
      (now - referenceTime) / 60_000;

    let issueType: EmailHealthIssueType | null =
      null;

    if (
      inactiveMinutes >=
      EMAIL_HEALTH_THRESHOLDS.processorInactiveMinutes
    ) {
      issueType = "processor_inactive";
    } else if (
      row.last_status === "failed" &&
      Number.isFinite(lastStarted) &&
      lastStarted >= activationTime
    ) {
      issueType = "processor_failed";
    }

    if (!issueType) {
      continue;
    }

    issues.push({
      issue_key:
        `scheduled_processor:${processor.name}`,

      email_type: "scheduled_processor",
      source_table: "email_processor_health",
      source_id: processor.name,
      issue_type: issueType,
      severity: "critical",
      source_status: row.last_status,
      error_code: row.last_error_code,
    });
  }

  return issues;
}

export async function detectScheduledEmailIssues(
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

  const sources: QueueConfig[] = [
    {
      table: "session_reminder_queue",
      emailType: "session_reminder",
      enabled:
        process.env.SESSION_REMINDERS_ENABLED === "true",
    },
    {
      table: "waitlist_email_queue",
      emailType: "waitlist_notification",
      enabled:
        process.env.WAITLIST_EMAILS_ENABLED === "true",
    },
  ];

  const issues: DetectedEmailIssue[] = [];

  for (const source of sources) {
    const detected = await detectQueueIssues(
      database,
      source,
      monitoringStartedAt,
      now,
    );

    issues.push(...detected);
  }

  const processorIssues =
    await detectProcessorIssues(
      database,
      monitoringStartedAt,
      now,
    );

  issues.push(...processorIssues);

  return issues;
}
