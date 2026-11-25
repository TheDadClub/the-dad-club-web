
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  sendAdminNotification,
  type AdminNotificationResult,
} from "./sendAdminNotification";

type AdminNotificationEvent =
  | "venue_enquiry"
  | "interest_registration"
  | "facilitator_application";

type ProcessAdminNotificationInput = {
  database: SupabaseClient;
  eventId: string;
  eventType: AdminNotificationEvent;
};

export async function processAdminNotification({
  database,
  eventId,
  eventType,
}: ProcessAdminNotificationInput): Promise<void> {
  try {
    // Create a notification record without replacing
    // any existing record for the same event.
    const { error: insertError } = await database
      .from("admin_notifications")
      .upsert(
        {
          event_id: eventId,
          event_type: eventType,
          status: "pending",
        },
        {
          onConflict: "event_type,event_id",
          ignoreDuplicates: true,
        },
      );

    if (insertError) {
      console.error(
        "Admin notification: unable to create record.",
        insertError.code,
      );
      return;
    }

    const attemptedAt = new Date().toISOString();

    // Atomically claim the pending notification.
    // Only one request can successfully claim it.
    const { data: claimed, error: claimError } =
      await database
        .from("admin_notifications")
        .update({
          status: "processing",
          attempted_at: attemptedAt,
          updated_at: attemptedAt,
        })
        .eq("event_id", eventId)
        .eq("event_type", eventType)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();

    if (claimError) {
      console.error(
        "Admin notification: unable to claim record.",
        claimError.code,
      );
      return;
    }

    if (!claimed) {
      // Already claimed or previously processed.
      return;
    }

    let outcome: AdminNotificationResult = {
      status: "not_confirmed",
    };

    try {
      outcome = await sendAdminNotification({
        eventId,
        eventType,
      });
    } catch {
      console.error(
        "Admin notification: sending outcome unavailable.",
      );
    }

    // Record the provider outcome.
    // Acceptance does not guarantee inbox delivery.
    const { data: recorded, error: updateError } =
      await database
        .from("admin_notifications")
        .update({
          status: outcome.status,
          provider_message_id:
            outcome.status === "accepted"
              ? outcome.providerId
              : null,
          accepted_at:
            outcome.status === "accepted"
              ? outcome.acceptedAt
              : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", claimed.id)
        .eq("status", "processing")
        .select("id")
        .maybeSingle();

    if (updateError || !recorded) {
      console.error(
        "Admin notification: outcome could not be recorded.",
      );
    }
  } catch {
    // Notification failures must not invalidate
    // an otherwise successful public submission.
    console.error(
      "Admin notification: processing failed.",
    );
  }
}
