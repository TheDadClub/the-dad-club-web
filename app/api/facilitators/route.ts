import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  facilitatorConsentVersion,
  facilitatorContactFields,
  facilitatorDeliveryModes,
  facilitatorExperienceFields,
  normaliseFacilitatorSource,
} from "../../../lib/facilitatorApplications";

type FormStatus = "success" | "invalid" | "verification" | "error";

const maximumBodyBytes = 131_072;

function redirectToForm(
  request: NextRequest,
  status: FormStatus,
  source = "website",
) {
  const url = new URL("/facilitators", request.url);

  url.searchParams.set("status", status);

  const normalisedSource = normaliseFacilitatorSource(source);

  if (normalisedSource !== "website") {
    url.searchParams.set("source", normalisedSource);
  }

  url.hash = "express-interest";

  const response = NextResponse.redirect(url, 303);
  response.headers.set("Cache-Control", "no-store");

  return response;
}

async function readForm(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (
    !contentType
      .toLowerCase()
      .startsWith("application/x-www-form-urlencoded")
  ) {
    throw new Error("Unsupported form encoding.");
  }

  const contentLength = Number(request.headers.get("content-length"));

  if (
    Number.isFinite(contentLength) &&
    contentLength > maximumBodyBytes
  ) {
    throw new Error("Form too large.");
  }

  if (!request.body) {
    throw new Error("Missing form.");
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let body = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      size += value.byteLength;

      if (size > maximumBodyBytes) {
        await reader.cancel();
        throw new Error("Form too large.");
      }

      body += decoder.decode(value, { stream: true });
    }

    body += decoder.decode();
  } finally {
    reader.releaseLock();
  }

  return new URLSearchParams(body);
}

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("origin");

  if (origin && origin !== requestUrl.origin) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  let data: URLSearchParams;

  try {
    data = await readForm(request);
  } catch {
    return redirectToForm(request, "invalid");
  }

  const readText = (field: string) =>
    (data.get(field) ?? "").trim();

  const source = normaliseFacilitatorSource(readText("source"));

  if (readText("website")) {
    return redirectToForm(request, "success", source);
  }

  const fields = [
    ...facilitatorContactFields.map((field) => ({
      name: field.name,
      required: true,
      maxLength: field.maxLength,
    })),
    ...facilitatorExperienceFields,
  ];

  const values: Record<string, string> = {};

  for (const field of fields) {
    if (data.getAll(field.name).length > 1) {
      return redirectToForm(request, "invalid", source);
    }

    const value = readText(field.name);

    if (
      (field.required && value.length === 0) ||
      value.length > field.maxLength
    ) {
      return redirectToForm(request, "invalid", source);
    }

    values[field.name] = value;
  }

  values.email = values.email.toLowerCase();

  const deliveryModes = data.getAll("delivery_modes");
  const allowedModes = new Set<string>(
    facilitatorDeliveryModes.map((mode) => mode.value),
  );

  const valid =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email) &&
    deliveryModes.length >= 1 &&
    deliveryModes.length <= 2 &&
    new Set(deliveryModes).size === deliveryModes.length &&
    deliveryModes.every((mode) => allowedModes.has(mode)) &&
    data.get("contactConsent") === "yes";

  if (!valid) {
    return redirectToForm(request, "invalid", source);
  }

  const token = readText("cf-turnstile-response");

  if (!token || token.length > 2048) {
    return redirectToForm(request, "verification", source);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecret = process.env.SUPABASE_SECRET_KEY;
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecret || !turnstileSecret) {
    console.error(
      "Facilitator application: missing server configuration.",
    );

    return redirectToForm(request, "error", source);
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
      return redirectToForm(request, "verification", source);
    }

    const verification: {
      success?: boolean;
      hostname?: string;
      action?: string;
    } = await response.json();

    if (
      verification.success !== true ||
      verification.action !== "facilitator_application" ||
      verification.hostname !== requestUrl.hostname
    ) {
      return redirectToForm(request, "verification", source);
    }
  } catch {
    console.error(
      "Facilitator application: verification unavailable.",
    );

    return redirectToForm(request, "verification", source);
  }

  try {
    const database = createClient(supabaseUrl, supabaseSecret, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });

    const { error } = await database
      .from("facilitator_applications")
      .insert({
        name: values.name,
        email: values.email,
        phone: values.phone,
        location: values.location,
        service_areas: values.service_areas,
        delivery_modes: deliveryModes,
        availability: values.availability,
        professional_experience: values.professional_experience,
        qualifications: values.qualifications,
        group_experience: values.group_experience,
        motivation: values.motivation,
        contact_consent: true,
        consent_version: facilitatorConsentVersion,
        source,
        status: "new",
      });

    if (error?.code === "23505") {
      // Preserve the existing application and avoid revealing
      // whether a particular email address has already applied.
      return redirectToForm(request, "success", source);
    }

    if (error) {
      console.error(
        "Facilitator application save failed:",
        error.code,
      );

      return redirectToForm(request, "error", source);
    }
  } catch {
    console.error(
      "Facilitator application: database request failed.",
    );

    return redirectToForm(request, "error", source);
  }

  return redirectToForm(request, "success", source);
}