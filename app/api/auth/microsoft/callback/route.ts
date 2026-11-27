
import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { requireAdmin } from "../../../../../lib/admin";
import {
  getMicrosoftConfig,
  getMicrosoftRedirectUri,
} from "../../../../../lib/microsoftAuth";
import {
  encryptMicrosoftToken,
} from "../../../../../lib/microsoftTokens";

const EXPECTED_MAILBOX = "hello@thedadclub.com.au";

function safeEqual(a: string, b: string): boolean {
  const first = Buffer.from(a);
  const second = Buffer.from(b);

  return (
    first.length === second.length &&
    timingSafeEqual(first, second)
  );
}

function redirectToDashboard(
  request: NextRequest,
  result: string
) {
  const url = new URL(
    "/admin/healthcare",
    request.nextUrl.origin
  );

  url.searchParams.set("microsoft", result);

  const response = NextResponse.redirect(url);

  for (const name of [
    "dadclub_ms_state",
    "dadclub_ms_verifier",
  ]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      secure: request.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/api/auth/microsoft",
      maxAge: 0,
    });
  }

  return response;
}

export async function GET(request: NextRequest) {
  const { user, database } = await requireAdmin();

  const code = request.nextUrl.searchParams.get("code");
  const returnedState =
    request.nextUrl.searchParams.get("state");

  const storedState =
    request.cookies.get("dadclub_ms_state")?.value;

  const codeVerifier =
    request.cookies.get("dadclub_ms_verifier")?.value;

  if (
    !code ||
    !returnedState ||
    !storedState ||
    !codeVerifier ||
    !safeEqual(returnedState, storedState)
  ) {
    return redirectToDashboard(
      request,
      "invalid_state"
    );
  }

  try {
    const config = getMicrosoftConfig();

    const tokenResponse = await fetch(
      `${config.authority}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          grant_type: "authorization_code",
          code,
          redirect_uri: getMicrosoftRedirectUri(
            request.nextUrl.origin
          ),
          code_verifier: codeVerifier,
          scope: config.scopes.join(" "),
        }),
        cache: "no-store",
      }
    );

    if (!tokenResponse.ok) {
      console.error(
        "Microsoft token exchange failed:",
        tokenResponse.status
      );

      return redirectToDashboard(
        request,
        "token_error"
      );
    }

    const tokens: {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
    } = await tokenResponse.json();

    if (
      !tokens.access_token ||
      !tokens.refresh_token ||
      !tokens.expires_in
    ) {
      return redirectToDashboard(
        request,
        "token_error"
      );
    }

    const profileResponse = await fetch(
      "https://graph.microsoft.com/v1.0/me?$select=id,mail,userPrincipalName",
      {
        headers: {
          Authorization:
            `Bearer ${tokens.access_token}`,
        },
        cache: "no-store",
      }
    );

    if (!profileResponse.ok) {
      return redirectToDashboard(
        request,
        "profile_error"
      );
    }

    const profile: {
      id?: string;
      mail?: string | null;
      userPrincipalName?: string;
    } = await profileResponse.json();

    const mailbox = (
      profile.mail ||
      profile.userPrincipalName ||
      ""
    ).toLowerCase();

    if (mailbox !== EXPECTED_MAILBOX) {
      return redirectToDashboard(
        request,
        "wrong_account"
      );
    }

    const encryptedAccessToken =
      encryptMicrosoftToken(tokens.access_token);

    const encryptedRefreshToken =
      encryptMicrosoftToken(tokens.refresh_token);

    const expiresAt = new Date(
      Date.now() +
        Math.max(tokens.expires_in - 120, 60) * 1000
    ).toISOString();

    const { error: saveError } = await database
      .from("microsoft_connections")
      .upsert(
        {
          admin_user_id: user.id,
          mailbox_email: EXPECTED_MAILBOX,
          encrypted_access_token:
            encryptedAccessToken,
          encrypted_refresh_token:
            encryptedRefreshToken,
          access_token_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "mailbox_email",
        }
      );

    if (saveError) {
      console.error(
        "Unable to save Microsoft connection:",
        saveError.code
      );

      return redirectToDashboard(
        request,
        "save_error"
      );
    }

    return redirectToDashboard(
      request,
      "connected"
    );
  } catch (error) {
    console.error(
      "Microsoft authentication failed:",
      error instanceof Error
        ? error.message
        : "Unknown error"
    );

    return redirectToDashboard(
      request,
      "connection_error"
    );
  }
}
