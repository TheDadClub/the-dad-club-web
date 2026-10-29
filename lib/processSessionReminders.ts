import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminDatabase } from "./admin";
import {
  buildSessionReminderEmail,
  type SessionReminderDetails,
} from "./sessionReminderEmail";

type FrozenPayload = {
  body: string;
  fingerprint: string;
};

type QueueItem = {
  id: string;
  booking_id: string;
  session_starts_at: string;
  scheduled_for: string;
  lease_token: string;
  first_attempt_at: string;
  payload: FrozenPayload | null;
};

type Outcome = "queued" | "accepted" | "skipped" | "review";

type Eligibility =
  | { status: "eligible"; details: SessionReminderDetails }
  | { status: "ineligible" }
  | { status: "claim_lost" };

function fingerprint(details: SessionReminderDetails) {
  return createHash("sha256")
    .update(JSON.stringify(details))
    .digest("hex");
}

async function finish(
  database: SupabaseClient,
  job: QueueItem,
  status: Outcome,
  errorCode: string | null = null,
  providerId: string | null = null,
) {
  const { data, error } = await database.rpc(
    "finish_session_reminder",
    {
      p_id: job.id,
      p_lease_token: job.lease_token,
      p_status: status,
      p_provider_message_id: providerId,
      p_error_code: errorCode,
    },
  );

  if (error || data !== true) {
    throw new Error("Reminder outcome could not be recorded.");
  }

  return status;
}

async function eligibility(
  database: SupabaseClient,
  job: QueueItem,
): Promise<Eligibility> {
  const now = Date.now();

  const [claimResult, bookingResult] = await Promise.all([
    database
      .from("session_reminder_queue")
      .select("id")
      .eq("id", job.id)
      .eq("status", "processing")
      .eq("lease_token", job.lease_token)
      .gt("lease_expires_at", new Date(now).toISOString())
      .maybeSingle(),

    database
      .from("session_bookings")
      .select("member_id, session_id, status")
      .eq("id", job.booking_id)
      .maybeSingle(),
  ]);

  if (claimResult.error || bookingResult.error) {
    throw new Error("Reminder eligibility lookup unavailable.");
  }

  if (!claimResult.data) {
    return { status: "claim_lost" };
  }

  const booking = bookingResult.data;

  if (!booking || booking.status !== "booked") {
    return { status: "ineligible" };
  }

  const [memberResult, sessionResult] = await Promise.all([
    database
      .from("members")
      .select("email, status")
      .eq("id", booking.member_id)
      .maybeSingle(),

    database
      .from("program_sessions")
      .select(
        "session_number, starts_at, ends_at, venue_name, venue_address, status",
      )
      .eq("id", booking.session_id)
      .maybeSingle(),
  ]);

  if (memberResult.error || sessionResult.error) {
    throw new Error("Reminder session or member lookup unavailable.");
  }

  const member = memberResult.data;
  const session = sessionResult.data;

  if (
    !member ||
    !session ||
    member.status !== "active" ||
    session.status !== "published"
  ) {
    return { status: "ineligible" };
  }

  const startsAt = Date.parse(session.starts_at);
  const endsAt = Date.parse(session.ends_at);
  const expectedStart = Date.parse(job.session_starts_at);
  const scheduledFor = Date.parse(job.scheduled_for);
  const checkedAt = Date.now();

  if (
    !Number.isFinite(startsAt) ||
    !Number.isFinite(endsAt) ||
    !Number.isFinite(expectedStart) ||
    !Number.isFinite(scheduledFor) ||
    startsAt !== expectedStart ||
    startsAt <= checkedAt ||
    endsAt <= startsAt ||
    scheduledFor > checkedAt
  ) {
    return { status: "ineligible" };
  }

  return {
    status: "eligible",
    details: {
      email: String(member.email ?? "").trim().toLowerCase(),
      session_number: session.session_number,
      starts_at: session.starts_at,
      ends_at: session.ends_at,
      venue_name: String(session.venue_name ?? ""),
      venue_address: String(session.venue_address ?? ""),
    },
  };
}

async function processOne(
  database: SupabaseClient,
  job: QueueItem,
  apiKey: string,
  from: string,
): Promise<Outcome | "unconfirmed"> {
  try {
    const current = await eligibility(database, job);

    if (current.status === "claim_lost") {
      return "unconfirmed";
    }

    if (current.status === "ineligible") {
      return await finish(
        database,
        job,
        "skipped",
        "ineligible",
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(current.details.email)
    ) {
      return await finish(
        database,
        job,
        "review",
        "invalid_email",
      );
    }

    const currentFingerprint = fingerprint(current.details);
    let payload = job.payload;

    if (payload === null) {
      const frozen: FrozenPayload = {
        body: JSON.stringify(
          buildSessionReminderEmail(current.details, from),
        ),
        fingerprint: currentFingerprint,
      };

      const { data, error } = await database
        .from("session_reminder_queue")
        .update({ payload: frozen })
        .eq("id", job.id)
        .eq("status", "processing")
        .eq("lease_token", job.lease_token)
        .is("payload", null)
        .select("payload")
        .maybeSingle();

      if (error || !data) {
        throw new Error("Reminder email request could not be saved.");
      }

      payload = data.payload as FrozenPayload;
    }

    if (
      !payload ||
      typeof payload.body !== "string" ||
      typeof payload.fingerprint !== "string"
    ) {
      return await finish(
        database,
        job,
        "review",
        "invalid_payload",
      );
    }

    // Do not retry an email containing outdated recipient
    // or session details.
    if (payload.fingerprint !== currentFingerprint) {
      return await finish(
        database,
        job,
        "review",
        "details_changed",
      );
    }

    // Check again immediately before contacting the email provider.
    const finalCheck = await eligibility(database, job);

    if (finalCheck.status === "claim_lost") {
      return "unconfirmed";
    }

    if (finalCheck.status === "ineligible") {
      return await finish(
        database,
        job,
        "skipped",
        "ineligible",
      );
    }

    if (
      fingerprint(finalCheck.details) !== payload.fingerprint
    ) {
      return await finish(
        database,
        job,
        "review",
        "details_changed",
      );
    }

    const firstAttempt = Date.parse(job.first_attempt_at);

    if (
      !Number.isFinite(firstAttempt) ||
      Date.now() - firstAttempt >= 23 * 60 * 60 * 1000
    ) {
      return await finish(
        database,
        job,
        "review",
        "retry_window",
      );
    }

    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `session-reminder/${job.id}`,
        },
        body: payload.body,
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      const retryable =
        response.status === 408 ||
        response.status === 429 ||
        response.status >= 500;

      return await finish(
        database,
        job,
        retryable ? "queued" : "review",
        `provider_${response.status}`,
      );
    }

    const result: { id?: string } = await response.json();

    if (typeof result.id !== "string" || !result.id.trim()) {
      return await finish(
        database,
        job,
        "queued",
        "acceptance_unconfirmed",
      );
    }

    return await finish(
      database,
      job,
      "accepted",
      null,
      result.id,
    );
  } catch {
    // A timeout may still have resulted in an accepted email.
    // Retries reuse the saved request and original idempotency key.
    console.error("Session reminder: attempt not confirmed.");

    try {
      return await finish(
        database,
        job,
        "queued",
        "attempt_unconfirmed",
      );
    } catch {
      // A later run can recover an expired lease.
      console.error("Session reminder: outcome not recorded.");
      return "unconfirmed";
    }
  }
}

export async function processSessionReminders() {
  if (process.env.SESSION_REMINDERS_ENABLED !== "true") {
    return { enabled: false };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error("Session reminder configuration is missing.");
  }

  const database = createAdminDatabase();

  const { data: enqueued, error: enqueueError } =
    await database.rpc("enqueue_session_reminders");

  if (enqueueError) {
    throw new Error("Unable to queue session reminders.");
  }

  const { data, error } = await database.rpc(
    "claim_session_reminders",
  );

  if (error || !Array.isArray(data)) {
    throw new Error("Unable to claim session reminders.");
  }

  const jobs = data as QueueItem[];

  const totals = {
    accepted: 0,
    queued: 0,
    skipped: 0,
    review: 0,
    unconfirmed: 0,
  };

  for (const job of jobs) {
    const outcome = await processOne(
      database,
      job,
      apiKey,
      from,
    );

    totals[outcome] += 1;
  }

  return {
    enabled: true,
    enqueued,
    claimed: jobs.length,
    ...totals,
  };
}