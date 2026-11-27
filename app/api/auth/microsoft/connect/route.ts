
import { NextRequest, NextResponse } from "next/server";
import { createHash, randomBytes } from "node:crypto";
import { requireAdmin } from "../../../../../lib/admin";
import {
  getMicrosoftConfig,
  getMicrosoftRedirectUri,
} from "../../../../../lib/microsoftAuth";

function base64url(buffer: Buffer): string {
  return buffer.toString("base64url");
}

export async function GET(request: NextRequest) {
  await requireAdmin();

  const config = getMicrosoftConfig();

  const redirectUri = getMicrosoftRedirectUri(
    request.nextUrl.origin
  );

  const state = base64url(randomBytes(32));
  const codeVerifier = base64url(randomBytes(64));

  const codeChallenge = base64url(
    createHash("sha256")
      .update(codeVerifier)
      .digest()
  );

  const authorizationUrl = new URL(
    `${config.authority}/oauth2/v2.0/authorize`
  );

  authorizationUrl.searchParams.set(
    "client_id",
    config.clientId
  );

  authorizationUrl.searchParams.set(
    "response_type",
    "code"
  );

  authorizationUrl.searchParams.set(
    "redirect_uri",
    redirectUri
  );

  authorizationUrl.searchParams.set(
    "response_mode",
    "query"
  );

  authorizationUrl.searchParams.set(
    "scope",
    config.scopes.join(" ")
  );

  authorizationUrl.searchParams.set(
    "state",
    state
  );

  authorizationUrl.searchParams.set(
    "code_challenge",
    codeChallenge
  );

  authorizationUrl.searchParams.set(
    "code_challenge_method",
    "S256"
  );

  authorizationUrl.searchParams.set(
    "prompt",
    "select_account"
  );

  const response = NextResponse.redirect(
    authorizationUrl.toString()
  );

  const secure =
    request.nextUrl.protocol === "https:";

  response.cookies.set(
    "dadclub_ms_state",
    state,
    {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/api/auth/microsoft",
      maxAge: 600,
    }
  );

  response.cookies.set(
    "dadclub_ms_verifier",
    codeVerifier,
    {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/api/auth/microsoft",
      maxAge: 600,
    }
  );

  return response;
}
