
import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { processWaitlistNotifications } from "../../../../lib/processWaitlistNotifications";
import {
  startEmailProcessorRun,
  finishEmailProcessorRun,
} from "../../../../lib/emailProcessorHealth";

export const maxDuration = 120;

function json(body: object, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret || secret.length < 32) {
    return json(
      { error: "Scheduled job is not configured." },
      503,
    );
  }

  const supplied = Buffer.from(
    request.headers.get("authorization") ?? "",
  );

  const expected = Buffer.from(`Bearer ${secret}`);

  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  ) {
    return json({ error: "Unauthorized." }, 401);
  }

  // Only authenticated requests can update processor health.
  const run = await startEmailProcessorRun(
    "waitlist_notifications",
  );

  try {
    const result = await processWaitlistNotifications();

    await finishEmailProcessorRun(
      run,
      result.enabled ? "success" : "disabled",
    );

    return json(result);
  } catch {
    console.error("Waitlist scheduled job failed.");

    await finishEmailProcessorRun(
      run,
      "failed",
      "waitlist_notification_processing_failed",
    );

    return json(
      { error: "Notification processing failed." },
      500,
    );
  }
}
