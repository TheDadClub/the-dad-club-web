import "server-only";

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminDatabase } from "./admin";
import {
  buildWaitlistEmail,
  type WaitlistEmailDetails,
} from "./waitlistEmail";

type FrozenPayload = {
  body: string;
  fingerprint: string;
};

type QueueItem = {
  id: string;
  waitlist_id: string;
  waitlist_joined_at: string;
  lease_token: string;
  first_attempt_at: string;
  payload: FrozenPayload | null;
};

type Outcome = "queued" | "accepted" | "skipped" | "review";

type Eligibility =
  | { status: "eligible"; details: WaitlistEmailDetails }
  | { status: "full" }
  | { status: "ineligible" }
  | { status: "claim_lost" };

function fingerprint(details: WaitlistEmailDetails) {
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
    "finish_waitlist_notification",
    {
      p_id: job.id,
      p_lease_token: job.lease_token,
      p_status: status,
      p_provider_message_id: providerId,
      p_error_code: errorCode,
    },
  );

  if (error || data !== true) {
    throw new Error("Notification outcome could not be recorded.");
  }

  return status;
}

async function eligibility(
  database: SupabaseClient,
  job: QueueItem,
): Promise<Eligibility> {
  const [claimResult, waitlistResult] = await Promise.all([
    database
      .from("waitlist_email_queue")
      .select("id")
      .eq("id", job.id)
      .eq("status", "processing")
      .eq("lease_token", job.lease_token)
      .gt("lease_expires_at", new Date().toISOString())
      .maybeSingle(),

    database
      .from("session_waitlist")
      .select("member_id, session_id")
      .eq("id", job.waitlist_id)
      .eq("joined_at", job.waitlist_joined_at)
      .eq("status", "waiting")
      .maybeSingle(),
  ]);

  if (claimResult.error || waitlistResult.error) {
    throw new Error("Eligibility lookup unavailable.");
  }

  if (!claimResult.data) {
    return { status: "claim_lost" };
  }

  if (!waitlistResult.data) {
    return { status: "ineligible" };
  }

  const entry = waitlistResult.data;

  const [memberResult, sessionResult] = await Promise.all([
    database
      .from("members")
      .select("email, status")
      .eq("id", entry.member_id)
      .maybeSingle(),

    database
      .from("program_sessions")
      .select(
        "session_number, starts_at, ends_at, venue_name, venue_address, capacity, status",
      )
      .eq("id", entry.session_id)
      .maybeSingle(),
  ]);

  if (memberResult.error || sessionResult.error) {
    throw new Error("Session or member lookup unavailable.");
  }

  const member = memberResult.data;
  const session = sessionResult.data;

  if (
    !member ||
    !session ||
    member.status !== "active" ||
    session.status !== "published" ||
    Date.parse(session.starts_at) <= Date.now()
  ) {
    return { status: "ineligible" };
  }

  const [entitlementResult, bookingResult, capacityResult] =
    await Promise.all([
      database
        .from("member_entitlements")
        .select("status")
        .eq("member_id", entry.member_id)
        .eq("session_number", session.session_number)
        .maybeSingle(),

      database
        .from("session_bookings")
        .select("id", { count: "exact", head: true })
        .eq("member_id", entry.member_id)
        .eq("session_number", session.session_number)
        .in("status", ["booked", "attended"]),

      database
        .from("session_bookings")
        .select("id", { count: "exact", head: true })
        .eq("session_id", entry.session_id)
        .in("status", ["booked", "attended"]),
    ]);

  if (
    entitlementResult.error ||
    bookingResult.error ||
    capacityResult.error ||
    bookingResult.count === null ||
    capacityResult.count === null
  ) {
    throw new Error(
      "Entitlement or availability lookup unavailable.",
    );
  }

  if (
    entitlementResult.data?.status !== "available" ||
    bookingResult.count > 0
  ) {
    return { status: "ineligible" };
  }

  if (capacityResult.count >= session.capacity) {
    return { status: "full" };
  }

  return {
    status: "eligible",
    details: {
      email: String(member.email).trim().toLowerCase(),
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

    if (current.status === "full") {
      return await finish(
        database,
        job,
        "queued",
        "session_full",
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
          buildWaitlistEmail(current.details, from),
        ),
        fingerprint: currentFingerprint,
      };

      // Save the exact request before attempting delivery.
      const { data, error } = await database
        .from("waitlist_email_queue")
        .update({ payload: frozen })
        .eq("id", job.id)
        .eq("status", "processing")
        .eq("lease_token", job.lease_token)
        .is("payload", null)
        .select("payload")
        .maybeSingle();

      if (error || !data) {
        throw new Error("Email request could not be saved.");
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

    // Changed recipient or session details require review
    // instead of retrying an outdated email.
    if (payload.fingerprint !== currentFingerprint) {
      return await finish(
        database,
        job,
        "review",
        "details_changed",
      );
    }

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

    if (finalCheck.status === "full") {
      return await finish(
        database,
        job,
        "queued",
        "session_full",
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
          "Idempotency-Key": `waitlist-availability/${job.id}`,
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

    if (typeof result.id !== "string" || !result.id) {
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
    // A timeout may still have resulted in a sent email.
    // Retries reuse the saved request and original key.
    console.error(
      "Waitlist notification: attempt not confirmed.",
    );

    try {
      return await finish(
        database,
        job,
        "queued",
        "attempt_unconfirmed",
      );
    } catch {
      // An expired lease can be recovered by a later run.
      console.error(
        "Waitlist notification: outcome not recorded.",
      );
      return "unconfirmed";
    }
  }
}

export async function processWaitlistNotifications() {
  if (process.env.WAITLIST_EMAILS_ENABLED !== "true") {
    return { enabled: false };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error(
      "Waitlist email configuration is missing.",
    );
  }

  const database = createAdminDatabase();

  const { data: enqueued, error: enqueueError } =
    await database.rpc("enqueue_waitlist_notifications");

  if (enqueueError) {
    throw new Error(
      "Unable to queue waitlist notifications.",
    );
  }

  const { data, error } = await database.rpc(
    "claim_waitlist_notifications",
  );

  if (error || !Array.isArray(data)) {
    throw new Error(
      "Unable to claim waitlist notifications.",
    );
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