
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type FormStatus =
  | "success"
  | "invalid"
  | "verification"
  | "error";

const allowedCapacities = new Set([
  "6-12",
  "13-20",
  "20+",
  "unsure",
]);

const allowedPrivacy = new Set([
  "private",
  "semi-private",
  "open",
]);

const allowedEquipment = new Set([
  "tv",
  "projector",
  "both",
  "none",
]);

const allowedComplimentary = new Set([
  "yes",
  "discuss",
  "no",
]);

const allowedEvenings = new Set([
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
]);

function redirectToForm(
  request: NextRequest,
  status: FormStatus,
) {
  const url = new URL("/venues", request.url);
  url.searchParams.set("status", status);
  url.hash = "venue-registration";

  return NextResponse.redirect(url, 303);
}

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");

  if (origin && origin !== requestUrl.origin) {
    return new NextResponse("Forbidden", {
      status: 403,
    });
  }

  const contentLength = Number(
    request.headers.get("content-length"),
  );

  if (
    Number.isFinite(contentLength) &&
    contentLength > 16_384
  ) {
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
    return typeof value === "string"
      ? value.trim()
      : "";
  }

  if (readText("venueWebsite")) {
    return redirectToForm(request, "success");
  }

  const venueName = readText("venueName");
  const suburb = readText("suburb");
  const contactName = readText("contactName");
  const contactEmail = readText(
    "contactEmail",
  ).toLowerCase();
  const contactPhone = readText("contactPhone");

  const capacity = readText("capacity");
  const privacy = readText("privacy");
  const equipment = readText("equipment");
  const complimentary = readText("complimentary");
  const notes = readText("notes");

  const evenings = data.getAll("evenings");

  const contactConsent =
    data.get("contactConsent") === "yes";

  const token = readText("cf-turnstile-response");

  const validEvenings =
    evenings.length <= 4 &&
    evenings.every(
      (value) =>
        typeof value === "string" &&
        allowedEvenings.has(value),
    ) &&
    new Set(evenings).size === evenings.length;

  const valid =
    venueName.length >= 1 &&
    venueName.length <= 150 &&
    suburb.length >= 1 &&
    suburb.length <= 100 &&
    contactName.length >= 1 &&
    contactName.length <= 100 &&
    contactEmail.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      contactEmail,
    ) &&
    contactPhone.length <= 30 &&
    allowedCapacities.has(capacity) &&
    allowedPrivacy.has(privacy) &&
    allowedEquipment.has(equipment) &&
    allowedComplimentary.has(complimentary) &&
    validEvenings &&
    notes.length <= 1000 &&
    contactConsent;

  if (!valid) {
    return redirectToForm(request, "invalid");
  }

  if (!token || token.length > 2048) {
    return redirectToForm(request, "verification");
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecret =
    process.env.SUPABASE_SECRET_KEY;
  const turnstileSecret =
    process.env.TURNSTILE_SECRET_KEY;

  if (
    !supabaseUrl ||
    !supabaseSecret ||
    !turnstileSecret
  ) {
    console.error(
      "Venue registration: missing server configuration.",
    );

    return redirectToForm(request, "error");
  }

  try {
    const response = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
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
      return redirectToForm(
        request,
        "verification",
      );
    }

    const verification: {
      success?: boolean;
      hostname?: string;
      action?: string;
    } = await response.json();

    if (
      verification.success !== true ||
      verification.action !== "venue_enquiry" ||
      verification.hostname !== requestUrl.hostname
    ) {
      return redirectToForm(
        request,
        "verification",
      );
    }
  } catch {
    console.error(
      "Venue registration: verification unavailable.",
    );

    return redirectToForm(
      request,
      "verification",
    );
  }

  const supabase = createClient(
    supabaseUrl,
    supabaseSecret,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );

  try {
    const { error } = await supabase
      .from("venue_partners")
      .insert({
        venue_name: venueName,
        suburb,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone || null,
        capacity,
        privacy,
        equipment,
        evenings,
        complimentary,
        notes: notes || null,
        status: "new",
        source: "website",
        contact_consent_at:
          new Date().toISOString(),
      });

    if (error) {
      console.error(
        "Venue registration failed:",
        error.code,
      );

      return redirectToForm(request, "error");
    }
  } catch {
    console.error(
      "Venue registration: database connection failed.",
    );

    return redirectToForm(request, "error");
  }

  return redirectToForm(request, "success");
}
