"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireMember } from "../../lib/members";
import { createAuthClient } from "../../lib/supabase/server";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const errorCodes: Record<string, string> = {
  "This session is unavailable.": "session",
  "Only future published sessions can be waitlisted.": "session",
  "This session entitlement is not available.": "entitlement",
  "You already have a booking for this session type.": "duplicate",
  "This session has space. Please book it instead.": "space",
  "An active membership is required.": "access",
};

export async function changeMemberWaitlist(formData: FormData) {
  await requireMember();

  const sessionValue = formData.get("session_id");
  const intent = formData.get("intent");

  const sessionId =
    typeof sessionValue === "string" ? sessionValue.trim() : "";

  if (
    !uuidPattern.test(sessionId) ||
    (intent !== "join" && intent !== "leave")
  ) {
    redirect("/members?waitlistError=invalid#sessions");
  }

  let errorCode = "";

  try {
    const auth = await createAuthClient();

    // The database derives membership from the authenticated user.
    // No member ID is accepted from the form.
    const { error } = await auth.rpc("set_member_waitlist", {
      p_session_id: sessionId,
      p_join: intent === "join",
    });

    if (error) {
      errorCode = errorCodes[error.message] ?? "unknown";
      console.error("Member waitlist change failed:", error.code);
    }
  } catch {
    errorCode = "unknown";
    console.error("Member waitlist: outcome unavailable.");
  }

  revalidatePath("/members");
  revalidatePath("/admin/bookings");

  if (errorCode) {
    redirect(`/members?waitlistError=${errorCode}#sessions`);
  }

  const query = new URLSearchParams({
    waitlist: intent === "join" ? "joined" : "left",
  });

  redirect(`/members?${query.toString()}#sessions`);
}