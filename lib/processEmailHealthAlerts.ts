
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminDatabase } from "./admin";
import {
  buildEmailHealthAlertPayload,
  sendEmailHealthAlert,
  type EmailHealthAlertItem,
} from "./sendEmailHealthAlert";

type FrozenPayload = {
  body: string;
};

type AlertJob = {
  id: string;
  lease_token: string;
  first_attempt_at: string;
  payload: FrozenPayload | null;
};

type Outcome =
  | "accepted"
  | "pending"
  | "failed"
  | "not_confirmed"
  | "unconfirmed";

async function finish(
  database: SupabaseClient,
  job: AlertJob,
  status: Exclude<Outcome, "unconfirmed">,
  errorCode: string | null = null,
  providerId: string | null = null,
): Promise<Outcome> {
  const { data, error } = await database.rpc(
    "finish_email_health_alert",
    {
      p_id: job.id,
      p_lease_token: job.lease_token,
      p_status: status,
      p_provider_message_id: providerId,
      p_error_code: errorCode,
    },
  );

  if (error || data !== true) {
    throw new Error(
      "Email health alert outcome could not be recorded.",
    );
  }

  // The database may convert pending to not_confirmed
  // when the retry limit has been reached.
  const { data: recorded, error: lookupError } =
    await database
      .from("email_health_alerts")
      .select("status")
      .eq("id", job.id)
      .maybeSingle();

  if (lookupError || !recorded) {
    return "unconfirmed";
  }

  switch (recorded.status) {
    case "accepted":
    case "pending":
    case "failed":
    case "not_confirmed":
      return recorded.status;

    default:
      return "unconfirmed";
  }
}

async function monitoringEnabled(
  database: SupabaseClient,
): Promise<boolean> {
  const { data, error } = await database
    .from("email_health_settings")
    .select("enabled,monitoring_started_at")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    throw new Error(
      "Email health settings unavailable.",
    );
  }

  return (
    data.enabled === true &&
    typeof data.monitoring_started_at === "string"
  );
}

async function ownsLease(
  database: SupabaseClient,
  job: AlertJob,
): Promise<boolean> {
  const minimumExpiry = new Date(
    Date.now() + 15_000,
  ).toISOString();

  const { data, error } = await database
    .from("email_health_alerts")
    .select("id")
    .eq("id", job.id)
    .eq("status", "processing")
    .eq("lease_token", job.lease_token)
    .gt("lease_expires_at", minimumExpiry)
    .maybeSingle();

  if (error) {
    throw new Error(
      "Email health alert lease lookup failed.",
    );
  }

  return Boolean(data);
}

async function loadAlertItems(
  database: SupabaseClient,
  alertId: string,
): Promise<EmailHealthAlertItem[]> {
  const items: EmailHealthAlertItem[] = [];
  const pageSize = 200;

  let lastIssueId: string | null = null;

  while (true) {
    let query = database
      .from("email_health_alert_items")
      .select(
        "issue_id,email_type,issue_type,severity",
      )
      .eq("alert_id", alertId)
      .order("issue_id", { ascending: true })
      .limit(pageSize);

    if (lastIssueId !== null) {
      query = query.gt("issue_id", lastIssueId);
    }

    const { data, error } = await query;

    if (error || !Array.isArray(data)) {
      throw new Error(
        "Email health alert items unavailable.",
      );
    }

    if (data.length === 0) {
      break;
    }

    for (const row of data) {
      if (
        typeof row.email_type !== "string" ||
        typeof row.issue_type !== "string" ||
        !["warning", "critical"].includes(
          row.severity,
        )
      ) {
        throw new Error(
          "Invalid email health alert snapshot.",
        );
      }

      items.push({
        email_type: row.email_type,
        issue_type: row.issue_type,
        severity: row.severity,
      } as EmailHealthAlertItem);
    }

    const nextId =
      data[data.length - 1].issue_id;

    if (
      typeof nextId !== "string" ||
      nextId === lastIssueId
    ) {
      throw new Error(
        "Email health alert pagination failed.",
      );
    }

    lastIssueId = nextId;

    if (data.length < pageSize) {
      break;
    }
  }

  return items;
}

async function processOne(
  database: SupabaseClient,
  job: AlertJob,
): Promise<Outcome> {
  try {
    if (!(await ownsLease(database, job))) {
      return "unconfirmed";
    }

    if (!(await monitoringEnabled(database))) {
      return await finish(
        database,
        job,
        "pending",
        "monitoring_disabled",
      );
    }

    let payload = job.payload;

    // Freeze the exact request before contacting Resend.
    if (payload === null) {
      const items = await loadAlertItems(
        database,
        job.id,
      );

      if (items.length === 0) {
        return await finish(
          database,
          job,
          "failed",
          "no_alert_items",
        );
      }

      if (
        !process.env.EMAIL_FROM?.trim() ||
        !process.env.ADMIN_NOTIFICATION_EMAIL?.trim()
      ) {
        return await finish(
          database,
          job,
          "pending",
          "missing_email_configuration",
        );
      }

      const frozen: FrozenPayload = {
        body: JSON.stringify(
          buildEmailHealthAlertPayload(items),
        ),
      };

      const { data, error } = await database
        .from("email_health_alerts")
        .update({
          payload: frozen,
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id)
        .eq("status", "processing")
        .eq("lease_token", job.lease_token)
        .gt(
          "lease_expires_at",
          new Date().toISOString(),
        )
        .is("payload", null)
        .select("payload")
        .maybeSingle();

      if (error || !data) {
        throw new Error(
          "Email health alert payload could not be saved.",
        );
      }

      payload = data.payload as FrozenPayload;
    }

    if (
      !payload ||
      typeof payload.body !== "string" ||
      !payload.body.trim()
    ) {
      return await finish(
        database,
        job,
        "not_confirmed",
        "invalid_payload",
      );
    }

    // Do not send a frozen alert to an outdated
    // administrator email address.
    const saved = JSON.parse(payload.body);

    const currentRecipient =
      process.env.ADMIN_NOTIFICATION_EMAIL?.trim();

    const currentFrom =
      process.env.EMAIL_FROM?.trim();

    if (!currentRecipient || !currentFrom) {
      return await finish(
        database,
        job,
        "pending",
        "missing_email_configuration",
      );
    }

    if (
      !Array.isArray(saved?.to) ||
      saved.to.length !== 1 ||
      saved.to[0] !== currentRecipient ||
      saved.from !== currentFrom
    ) {
      return await finish(
        database,
        job,
        "not_confirmed",
        "email_configuration_changed",
      );
    }

    // Confirm monitoring is still enabled.
    if (!(await monitoringEnabled(database))) {
      return await finish(
        database,
        job,
        "pending",
        "monitoring_disabled",
      );
    }

    // Confirm sufficient lease time immediately
    // before contacting the provider.
    if (!(await ownsLease(database, job))) {
      return "unconfirmed";
    }

    const firstAttempt = Date.parse(
      job.first_attempt_at,
    );

    if (
      !Number.isFinite(firstAttempt) ||
      Date.now() - firstAttempt + 15_000 >=
        23 * 60 * 60 * 1000
    ) {
      return await finish(
        database,
        job,
        "not_confirmed",
        "retry_window_exhausted",
      );
    }

    const outcome = await sendEmailHealthAlert({
      alertId: job.id,
      body: payload.body,
    });

    if (outcome.status === "accepted") {
      return await finish(
        database,
        job,
        "accepted",
        null,
        outcome.providerId,
      );
    }

    return await finish(
      database,
      job,
      outcome.status,
      outcome.errorCode,
    );
  } catch {
    console.error(
      "Email health alert: attempt not confirmed.",
    );

    try {
      return await finish(
        database,
        job,
        "pending",
        "attempt_unconfirmed",
      );
    } catch {
      // A subsequent run can recover the expired lease.
      console.error(
        "Email health alert: outcome not recorded.",
      );

      return "unconfirmed";
    }
  }
}

export async function processEmailHealthAlerts() {
  const database = createAdminDatabase();

  if (!(await monitoringEnabled(database))) {
    return { enabled: false };
  }

  const { data, error } = await database.rpc(
    "claim_email_health_alerts",
  );

  if (error || !Array.isArray(data)) {
    throw new Error(
      "Unable to claim email health alerts.",
    );
  }

  const jobs = data as AlertJob[];

  const totals = {
    accepted: 0,
    pending: 0,
    failed: 0,
    not_confirmed: 0,
    unconfirmed: 0,
  };

  for (const job of jobs) {
    const outcome = await processOne(
      database,
      job,
    );

    totals[outcome] += 1;
  }

  return {
    enabled: true,
    claimed: jobs.length,
    ...totals,
  };
}
