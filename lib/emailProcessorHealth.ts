
import "server-only";

import { randomUUID } from "node:crypto";
import { createAdminDatabase } from "./admin";
import type { ProcessorName } from "./emailHealthTypes";

type ProcessorRun = {
  processorName: ProcessorName;
  runId: string;
  startedAt: string;
};

type CompletionStatus =
  | "success"
  | "failed"
  | "disabled";

export async function startEmailProcessorRun(
  processorName: ProcessorName,
): Promise<ProcessorRun | null> {
  const runId = randomUUID();
  const startedAt = new Date().toISOString();

  try {
    const database = createAdminDatabase();

    const { data, error } = await database
      .from("email_processor_health")
      .update({
        current_run_id: runId,
        last_status: "running",
        last_started_at: startedAt,
        updated_at: startedAt,
      })
      .eq("processor_name", processorName)
      .or(
        `last_started_at.is.null,last_started_at.lt.${startedAt}`,
      )
      .select("processor_name")
      .maybeSingle();

    if (error || !data) {
      console.error(
        "Email processor health: start not recorded.",
        processorName,
      );

      return null;
    }

    return {
      processorName,
      runId,
      startedAt,
    };
  } catch {
    console.error(
      "Email processor health: start tracking unavailable.",
      processorName,
    );

    return null;
  }
}

export async function finishEmailProcessorRun(
  run: ProcessorRun | null,
  status: CompletionStatus,
  errorCode: string | null = null,
): Promise<void> {
  if (!run) {
    return;
  }

  try {
    const database = createAdminDatabase();
    const finishedAt = new Date().toISOString();

    const { data: current, error: lookupError } =
      await database
        .from("email_processor_health")
        .select("consecutive_failures")
        .eq("processor_name", run.processorName)
        .eq("current_run_id", run.runId)
        .eq("last_status", "running")
        .maybeSingle();

    if (lookupError) {
      console.error(
        "Email processor health: completion lookup failed.",
        run.processorName,
      );

      return;
    }

    if (!current) {
      // A newer run has already replaced this run.
      return;
    }

    const updates: Record<string, unknown> = {
      last_status: status,
      last_finished_at: finishedAt,
      current_run_id: null,
      updated_at: finishedAt,
    };

    if (status === "success") {
      updates.last_success_at = finishedAt;
      updates.last_error_code = null;
      updates.consecutive_failures = 0;
    }

    if (status === "failed") {
      updates.last_failure_at = finishedAt;
      updates.last_error_code =
        errorCode ?? "processor_failed";

      updates.consecutive_failures =
        Number(current.consecutive_failures ?? 0) + 1;
    }

    if (status === "disabled") {
      updates.last_error_code = null;
      updates.consecutive_failures = 0;
    }

    const { error } = await database
      .from("email_processor_health")
      .update(updates)
      .eq("processor_name", run.processorName)
      .eq("current_run_id", run.runId)
      .eq("last_status", "running");

    if (error) {
      console.error(
        "Email processor health: completion not recorded.",
        run.processorName,
      );
    }
  } catch {
    console.error(
      "Email processor health: completion tracking unavailable.",
      run.processorName,
    );
  }
}
