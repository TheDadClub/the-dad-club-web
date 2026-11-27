
import "server-only";

import { createAdminDatabase } from "./admin";

import {
  getBackgroundMicrosoftAccessToken,
} from "./microsoftConnection";

import {
  getOutlookMessages,
} from "./outlookMessages";

import {
  loadOutreachContacts,
  loadOutreachConversations,
} from "./outreachContacts";

import {
  processOutreachMessages,
} from "./processOutreachMessages";

const MAILBOX = "hello@thedadclub.com.au";

const OVERLAP_MINUTES = 60;
const MAX_EXECUTION_MS = 90_000;

type SyncSettings = {
  enabled: boolean;
  mailbox_email: string;
  sync_from_at: string;
  last_success_at: string | null;
};

export async function runOutreachSync() {
  const startedAt = Date.now();
  const database = createAdminDatabase();

  const { data: initialSettings, error: settingsError } =
    await database
      .from("outreach_sync_settings")
      .select("enabled")
      .eq("id", 1)
      .single();

  if (settingsError || !initialSettings) {
    throw new Error(
      "Unable to load outreach synchronisation settings."
    );
  }

  if (!initialSettings.enabled) {
    return {
      enabled: false,
      status: "disabled",
    };
  }

  const { data: leaseToken, error: claimError } =
    await database.rpc("claim_outreach_sync");

  if (claimError) {
    throw new Error(
      "Unable to acquire outreach synchronisation lease."
    );
  }

  if (!leaseToken) {
    return {
      enabled: true,
      status: "skipped",
      reason: "lease_unavailable",
    };
  }

  let errorCode = "sync_initialisation_failed";

  async function assertLease(): Promise<void> {
    if (Date.now() - startedAt >= MAX_EXECUTION_MS) {
      errorCode = "execution_budget_exceeded";

      throw new Error(
        "Outreach synchronisation execution budget exceeded."
      );
    }

    const { data, error } = await database.rpc(
      "owns_outreach_sync",
      {
        p_token: leaseToken,
      }
    );

    if (error || data !== true) {
      throw new Error(
        "Outreach synchronisation lease is no longer valid."
      );
    }
  }

  try {
    await assertLease();

    const { data, error } = await database
      .from("outreach_sync_settings")
      .select(
        "enabled,mailbox_email,sync_from_at,last_success_at"
      )
      .eq("id", 1)
      .single();

    if (error || !data) {
      throw new Error(
        "Unable to load active synchronisation settings."
      );
    }

    const settings = data as SyncSettings;

    if (
      !settings.enabled ||
      settings.mailbox_email !== MAILBOX
    ) {
      throw new Error(
        "Outreach synchronisation configuration is invalid."
      );
    }

    const historicalStart = Date.parse(
      settings.sync_from_at
    );

    const previousSuccess = settings.last_success_at
      ? Date.parse(settings.last_success_at)
      : null;

    if (
      !Number.isFinite(historicalStart) ||
      (
        previousSuccess !== null &&
        !Number.isFinite(previousSuccess)
      )
    ) {
      throw new Error(
        "Invalid outreach synchronisation timestamps."
      );
    }

    // Recheck recent correspondence to accommodate
    // delayed mailbox availability and overlapping runs.
    const fromTimestamp =
      previousSuccess === null
        ? historicalStart
        : Math.max(
            historicalStart,
            previousSuccess -
              OVERLAP_MINUTES * 60_000
          );

    const untilTimestamp = Date.now();

    if (fromTimestamp > untilTimestamp) {
      throw new Error(
        "Invalid outreach synchronisation date range."
      );
    }

    const fromAt = new Date(
      fromTimestamp
    ).toISOString();

    const untilAt = new Date(
      untilTimestamp
    ).toISOString();

    errorCode = "outlook_connection_failed";

    await assertLease();

    const accessToken =
      await getBackgroundMicrosoftAccessToken();

    errorCode = "contact_retrieval_failed";

    const contacts = await loadOutreachContacts(
      database,
      assertLease
    );

    errorCode = "conversation_retrieval_failed";

    const conversations =
      await loadOutreachConversations(
        database,
        assertLease
      );

    errorCode = "sent_items_retrieval_failed";

    const sentMessages = await getOutlookMessages({
      accessToken,
      folder: "sentitems",
      fromAt,
      untilAt,
      assertLease,
    });

    errorCode = "outbound_processing_failed";

    const outbound = await processOutreachMessages({
      database,
      leaseToken,
      accessToken,
      messages: sentMessages,
      direction: "outbound",
      contacts,
      conversations,
      assertLease,
    });

    errorCode = "inbox_retrieval_failed";

    const inboxMessages = await getOutlookMessages({
      accessToken,
      folder: "inbox",
      fromAt,
      untilAt,
      assertLease,
    });

    errorCode = "inbound_processing_failed";

    const inbound = await processOutreachMessages({
      database,
      leaseToken,
      accessToken,
      messages: inboxMessages,
      direction: "inbound",
      contacts,
      conversations,
      assertLease,
    });

    errorCode = "sync_finalisation_failed";

    await assertLease();

    const {
      data: finished,
      error: finishError,
    } = await database.rpc(
      "finish_outreach_sync",
      {
        p_token: leaseToken,
        p_status: "success",
        p_error_code: null,
      }
    );

    if (finishError || finished !== true) {
      throw new Error(
        "Unable to finalise outreach synchronisation."
      );
    }

    return {
      enabled: true,
      status: "success",
      historicalImport:
        previousSuccess === null,
      fromAt,
      untilAt,
      durationMs: Date.now() - startedAt,
      contacts: contacts.length,
      outbound,
      inbound,
      totalRecorded:
        outbound.recorded + inbound.recorded,
      totalDuplicates:
        outbound.duplicates + inbound.duplicates,
      totalAmbiguous:
        outbound.ambiguous + inbound.ambiguous,
      totalHeadersRetrieved:
        outbound.headersRetrieved +
        inbound.headersRetrieved,
      totalAutomatedExcluded:
        outbound.automatedExcluded +
        inbound.automatedExcluded,
    };
  } catch {
    console.error(
      "Outreach synchronisation failed:",
      errorCode
    );

    try {
      const { data: finished, error } =
        await database.rpc(
          "finish_outreach_sync",
          {
            p_token: leaseToken,
            p_status: "failed",
            p_error_code: errorCode,
          }
        );

      if (error || finished !== true) {
        console.error(
          "Unable to record outreach synchronisation failure."
        );
      }
    } catch {
      console.error(
        "Outreach synchronisation failure recording failed."
      );
    }

    throw new Error(
      `Outreach synchronisation failed: ${errorCode}.`
    );
  }
}
