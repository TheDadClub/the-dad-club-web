
import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import {
  runEmailHealthMonitor,
} from "../../../../lib/runEmailHealthMonitor";

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
    return json(
      { error: "Unauthorized." },
      401,
    );
  }

  try {
    const result = await runEmailHealthMonitor();

    return json(result);
  } catch {
    console.error(
      "Email health scheduled job failed.",
    );

    return json(
      { error: "Email health monitoring failed." },
      500,
    );
  }
}
