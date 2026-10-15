import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendInterestConfirmation } from "../../../lib/sendInterestConfirmation";

const allowedStages = new Set([
  "Preparing for fatherhood",
  "Expecting a baby",
  "Baby is 0–3 months old",
  "Baby is 3–12 months old",
  "Child is 12–24 months old",
  "Another stage or enquiring for someone else",
]);

type FormStatus =
  | "success"
  | "success_no_email"
  | "invalid"
  | "verification"
  | "error";

function redirectToForm(
  request: NextRequest,
  status: FormStatus,
) {
  const url = new URL("/join", request.url);
  url.searchParams.set("status", status);
  url.hash = "registration";

  return NextResponse.redirect(url, 303);
}

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");

  if (origin && origin !== requestUrl.origin) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const contentLength = Number(
    request.headers.get("content-length"),
  );

  if (Number.isFinite(contentLength) && contentLength > 16_384) {
    return redirectToForm(request, "invalid");
  }

  let data: FormData;

  try {
    data = await request.formData();
  } catch {
    return redirectToForm(request, "invalid");
  }

  function readText(field: string) {
    const value = data.get(field);
    return typeof value === "string" ? value.trim() : "";
  }

  if (readText("website")) {
    return redirectToForm(request, "success");
  }

  const name = readText("name");
  const email = readText("email").toLowerCase();
  const location = readText("location");
  const stage = readText("stage");
  const message = readText("message");
  const contactConsent = data.get("contactConsent") === "yes";
  const token = readText("cf-turnstile-response");

  const valid =
    name.length >= 1 &&
    name.length <= 100 &&
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    location.length >= 1 &&
    location.length <= 100 &&
    allowedStages.has(stage) &&
    message.length <= 600 &&
    contactConsent;

  if (!valid) {
    return redirectToForm(request, "invalid");
  }

  if (!token || token.length > 2048) {
    return redirectToForm(request, "verification");
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecret || !turnstileSecret) {
    console.error(
      "Interest registration: missing server configuration.",
    );
    return redirectToForm(request, "error");
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          secret: turnstileSecret,
          response: token,
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      },
    );

    if (!response.ok) {
      return redirectToForm(request, "verification");
    }

    const verification: {
      success?: boolean;
      hostname?: string;
      action?: string;
    } = await response.json();

    if (
      verification.success !== true ||
      verification.action !== "register_interest" ||
      verification.hostname !== requestUrl.hostname
    ) {
      return redirectToForm(request, "verification");
    }
  } catch {
    console.error("Interest registration: verification unavailable.");
    return redirectToForm(request, "verification");
  }

  const supabase = createClient(supabaseUrl, supabaseSecret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  const registrationId = randomUUID();

  // Save the registration before attempting email.
  try {
    const { error } = await supabase
      .from("interest_registrations")
      .insert({
        id: registrationId,
        name,
        email,
        location,
        stage,
        message,
        contact_consent: true,
        consent_version: "interest-v1",
        confirmation_email_status: "pending",
      });

    if (error?.code === "23505") {
      // Do not send another email or change an existing registration.
      return redirectToForm(request, "success");
    }

    if (error) {
      console.error("Interest registration failed:", error.code);
      return redirectToForm(request, "error");
    }
  } catch {
    console.error("Interest registration: database connection failed.");
    return redirectToForm(request, "error");
  }

  const emailAccepted = await sendInterestConfirmation({
    registrationId,
    email,
  });

  // "sent" means Resend accepted the email, not proven inbox delivery.
  try {
    const { error } = await supabase
      .from("interest_registrations")
      .update({
        confirmation_email_status: emailAccepted ? "sent" : "failed",
        confirmation_email_sent_at: emailAccepted
          ? new Date().toISOString()
          : null,
      })
      .eq("id", registrationId);

    if (error) {
      console.error("Confirmation status update failed:", error.code);
    }
  } catch {
    console.error("Confirmation status could not be updated.");
  }

  return redirectToForm(
    request,
    emailAccepted ? "success" : "success_no_email",
  );
}