
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import { createAdminDatabase } from "./admin";

import {
  detectImmediateEmailIssues,
} from "./detectImmediateEmailIssues";

import {
  detectScheduledEmailIssues,
} from "./detectScheduledEmailIssues";

import {
  resolveEmailHealthIssues,
} from "./resolveEmailHealthIssues";

import {
  processEmailHealthAlerts,
} from "./processEmailHealthAlerts";

import {
  startEmailProcessorRun,
  finishEmailProcessorRun,
} from "./emailProcessorHealth";

async function assertMonitorOwnership(
  database: SupabaseClient,
  token: string,
): Promise<void> {
  const { data, error } = await database.rpc(
    "owns_email_health_monitor",
    {
      p_token: token,
    },
  );

  if (error || data !== true) {
    throw new Error(
      "Email health monitoring lease unavailable.",
    );
  }
}

export async function runEmailHealthMonitor() {
  const database = createAdminDatabase();

  const { data: settings, error: settingsError } =
    await database
      .from("email_health_settings")
      .select("enabled,monitoring_started_at")
      .eq("id", 1)
      .maybeSingle();

  if (settingsError || !settings) {
    throw new Error(
      "Email health monitoring settings unavailable.",
    );
  }

  if (
    settings.enabled !== true ||
    !settings.monitoring_started_at
  ) {
    return {
      enabled: false,
      status: "disabled" as const,
    };
  }

  // Prevent overlapping monitoring executions.
  const { data: token, error: claimError } =
    await database.rpc(
      "claim_email_health_monitor",
    );

  if (claimError) {
    throw new Error(
      "Email health monitoring claim failed.",
    );
  }

  if (token === null) {
    return {
      enabled: true,
      status: "skipped" as const,
      reason: "monitor_unavailable",
    };
  }

  if (typeof token !== "string") {
    throw new Error(
      "Invalid email health monitoring token.",
    );
  }

  let run: Awaited<
    ReturnType<typeof startEmailProcessorRun>
  > = null;

  try {
    await assertMonitorOwnership(
      database,
      token,
    );

    run = await startEmailProcessorRun(
      "email_health_monitor",
    );

    // Reload settings after acquiring the lease.
    const {
      data: activeSettings,
      error: activeSettingsError,
    } = await database
      .from("email_health_settings")
      .select("enabled,monitoring_started_at")
      .eq("id", 1)
      .maybeSingle();

    if (
      activeSettingsError ||
      !activeSettings ||
      activeSettings.enabled !== true ||
      !activeSettings.monitoring_started_at
    ) {
      throw new Error(
        "Active monitoring settings unavailable.",
      );
    }

    const monitoringStartedAt =
      activeSettings.monitoring_started_at;

    const now = Date.now();

    const detectedAt =
      new Date(now).toISOString();

    // STAGE 1: Detect immediate email issues.
    await assertMonitorOwnership(
      database,
      token,
    );

    const immediateIssues =
      await detectImmediateEmailIssues(
        database,
        monitoringStartedAt,
        now,
      );

    // STAGE 2: Detect scheduled email and
    // processor issues.
    await assertMonitorOwnership(
      database,
      token,
    );

    const scheduledIssues =
      await detectScheduledEmailIssues(
        database,
        monitoringStartedAt,
        now,
      );

    const issues = [
      ...immediateIssues,
      ...scheduledIssues,
    ];

    // STAGE 3: Persist detected issues.
    await assertMonitorOwnership(
      database,
      token,
    );

    let recordedIssues = 0;

    if (issues.length > 0) {
      const { data, error } = await database.rpc(
        "record_email_health_issues",
        {
          p_issues: issues,
          p_detected_at: detectedAt,
        },
      );

      if (error || typeof data !== "number") {
        throw new Error(
          "Email health issue recording failed.",
        );
      }

      recordedIssues = data;
    }

    // STAGE 4: Resolve recovered issues.
    await assertMonitorOwnership(
      database,
      token,
    );

    const resolvedIssues =
      await resolveEmailHealthIssues(
        database,
      );

    // STAGE 5: Create a consolidated
    // administrator alert.
    await assertMonitorOwnership(
      database,
      token,
    );

    const {
      data: alertId,
      error: alertError,
    } = await database.rpc(
      "create_email_health_alert",
    );

    if (alertError) {
      throw new Error(
        "Email health alert creation failed.",
      );
    }

    // STAGE 6: Process new alerts and
    // eligible alert retries.
    await assertMonitorOwnership(
      database,
      token,
    );

    const alertProcessing =
      await processEmailHealthAlerts();

    await assertMonitorOwnership(
      database,
      token,
    );

    if (
      !alertProcessing.enabled ||
      ("unconfirmed" in alertProcessing &&
        (alertProcessing.unconfirmed ?? 0) > 0)
    ) {
      throw new Error(
        "Email health alert processing incomplete.",
      );
    }

    // STAGE 7: Record successful monitoring.
    await finishEmailProcessorRun(
      run,
      "success",
    );

    return {
      enabled: true,
      status: "success" as const,
      detectedIssues: issues.length,
      immediateIssues: immediateIssues.length,
      scheduledIssues: scheduledIssues.length,
      recordedIssues,
      resolvedIssues,
      alertCreated: typeof alertId === "string",
      alertProcessing,
    };

  } catch (error) {
    await finishEmailProcessorRun(
      run,
      "failed",
      "monitor_execution_failed",
    );

    console.error(
      "Email health monitoring execution failed.",
    );

    throw error;

  } finally {
    // Release only the lease owned by this execution.
    try {
      const { data, error } = await database.rpc(
        "release_email_health_monitor",
        {
          p_token: token,
        },
      );

      if (error || data !== true) {
        console.error(
          "Email health monitoring lease release unconfirmed.",
        );
      }
    } catch {
      console.error(
        "Email health monitoring lease release failed.",
      );
    }
  }
}
