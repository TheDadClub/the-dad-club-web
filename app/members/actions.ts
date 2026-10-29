"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAuthClient } from "../../lib/supabase/server";
import { createAdminDatabase } from "../../lib/admin";

export type MemberLoginState = {
  step: "email" | "code";
  email: string;
  error: string;
  attempt: number;
};

function field(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function verifyTurnstile(token: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const origin = (await headers()).get("origin");

  if (!secret || !origin || !token || token.length > 2048) {
    return false;
  }

  try {
    const hostname = new URL(origin).hostname;

    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret,
          response: token,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) return false;

    const result: {
      success?: boolean;
      action?: string;
      hostname?: string;
    } = await response.json();

    return (
      result.success === true &&
      result.action === "member_login" &&
      result.hostname === hostname
    );
  } catch {
    return false;
  }
}

export async function memberLogin(
  previous: MemberLoginState,
  formData: FormData,
): Promise<MemberLoginState> {
  const email = field(formData, "email").toLowerCase();

  const attempt =
    Number.isSafeInteger(previous.attempt) &&
    previous.attempt >= 0 &&
    previous.attempt < 100_000
      ? previous.attempt + 1
      : 1;

  const state: MemberLoginState = {
    step: "email",
    email,
    error: "",
    attempt,
  };

  if (
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return {
      ...state,
      error: "Please enter a valid email address.",
    };
  }

  const intent = field(formData, "intent");

  if (intent === "request") {
    const verified = await verifyTurnstile(
      field(formData, "cf-turnstile-response"),
    );

    if (!verified) {
      return {
        ...state,
        error: "Please complete the verification and try again.",
      };
    }

    try {
      const database = createAdminDatabase();

      const { data: members, error } = await database
        .from("members")
        .select("id")
        .eq("email", email)
        .eq("status", "active")
        .limit(2);

      if (error) {
        console.error("Member login: membership lookup failed.");
        return {
          ...state,
          error: "Sign-in is temporarily unavailable. Please try again.",
        };
      }

      // Only existing active members are sent a code.
      // Everyone receives the same public response.
      if (members?.length === 1) {
        const auth = await createAuthClient();

        const { error: sendError } = await auth.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
          },
        });

        if (sendError) {
          console.error(
            "Member login: code request failed:",
            sendError.code,
          );
        }
      }

      return {
        ...state,
        step: "code",
      };
    } catch {
      console.error("Member login: code request unavailable.");

      return {
        ...state,
        error: "Sign-in is temporarily unavailable. Please try again.",
      };
    }
  }

  if (intent !== "verify") {
    return {
      ...state,
      error: "Please request a login code.",
    };
  }

  const code = field(formData, "code").replace(/\s/g, "");

  if (!/^\d{6,10}$/.test(code)) {
    return {
      ...state,
      step: "code",
      error: "Please enter the code from your email.",
    };
  }

  try {
    const auth = await createAuthClient();

    const { data, error } = await auth.auth.verifyOtp({
      email,
      token: code,
      type: "email",
    });

    if (error || !data.user || !data.user.email_confirmed_at) {
      return {
        ...state,
        step: "code",
        error:
          "That code could not be verified. Check the code or request a new one.",
      };
    }

    // Link verified identity to an existing active member.
    // This function does not create a membership or entitlements.
    const { data: memberId, error: accessError } = await auth.rpc(
      "claim_member_access",
    );

    if (accessError || typeof memberId !== "string") {
      await auth.auth.signOut({ scope: "local" });

      return {
        ...state,
        error:
          "We couldn't open an active membership for this email. Please contact hello@thedadclub.com.au.",
      };
    }
  } catch {
    console.error("Member login: verification unavailable.");

    return {
      ...state,
      step: "code",
      error: "Sign-in is temporarily unavailable. Please try again.",
    };
  }

  redirect("/members");
}

export async function memberSignOut() {
  const auth = await createAuthClient();

  const { error } = await auth.auth.signOut({
    scope: "local",
  });

  if (error) {
    throw new Error("Unable to sign out. Please try again.");
  }

  redirect("/members/login");
}