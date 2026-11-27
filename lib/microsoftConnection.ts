
import "server-only";

import {
  createAdminDatabase,
  requireAdmin,
} from "./admin";

import { getMicrosoftConfig } from "./microsoftAuth";

import {
  encryptMicrosoftToken,
  decryptMicrosoftToken,
} from "./microsoftTokens";

const MAILBOX = "hello@thedadclub.com.au";

type AdminDatabase = ReturnType<typeof createAdminDatabase>;

type MicrosoftConnection = {
  id: string;
  admin_user_id: string;
  encrypted_access_token: string;
  encrypted_refresh_token: string;
  access_token_expires_at: string;
};

type MicrosoftTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
};

async function resolveMicrosoftAccessToken(
  database: AdminDatabase,
  expectedAdminId?: string
): Promise<string> {
  const { data, error } = await database
    .from("microsoft_connections")
    .select(
      "id,admin_user_id,encrypted_access_token,encrypted_refresh_token,access_token_expires_at"
    )
    .eq("mailbox_email", MAILBOX)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Microsoft Outlook is not connected.");
  }

  const saved = data as MicrosoftConnection;

  if (
    expectedAdminId &&
    saved.admin_user_id !== expectedAdminId
  ) {
    throw new Error(
      "You are not authorised to use this Outlook connection."
    );
  }

  // Ensure the saved connection still belongs
  // to an authorised administrator.
  const { data: admin, error: adminError } =
    await database
      .from("admin_users")
      .select("user_id")
      .eq("user_id", saved.admin_user_id)
      .maybeSingle();

  if (adminError || !admin) {
    throw new Error(
      "The Outlook connection owner is no longer authorised."
    );
  }

  const expiresAt = new Date(
    saved.access_token_expires_at
  ).getTime();

  if (
    Number.isFinite(expiresAt) &&
    expiresAt > Date.now() + 60_000
  ) {
    return decryptMicrosoftToken(
      saved.encrypted_access_token
    );
  }

  const config = getMicrosoftConfig();

  const refreshToken = decryptMicrosoftToken(
    saved.encrypted_refresh_token
  );

  const response = await fetch(
    `${config.authority}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        scope: config.scopes.join(" "),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    }
  );

  if (!response.ok) {
    throw new Error(
      "Outlook connection expired. Please reconnect Microsoft Outlook."
    );
  }

  const tokens =
    (await response.json()) as MicrosoftTokenResponse;

  if (
    !tokens.access_token ||
    typeof tokens.expires_in !== "number" ||
    !Number.isFinite(tokens.expires_in) ||
    tokens.expires_in <= 0
  ) {
    throw new Error(
      "Microsoft did not return a valid access token."
    );
  }

  const nextRefreshToken =
    tokens.refresh_token || refreshToken;

  const expiresAtIso = new Date(
    Date.now() +
      Math.max(tokens.expires_in - 120, 0) * 1000
  ).toISOString();

  const { data: updated, error: updateError } =
    await database
      .from("microsoft_connections")
      .update({
        encrypted_access_token:
          encryptMicrosoftToken(tokens.access_token),
        encrypted_refresh_token:
          encryptMicrosoftToken(nextRefreshToken),
        access_token_expires_at: expiresAtIso,
        updated_at: new Date().toISOString(),
      })
      .eq("id", saved.id)
      .eq("admin_user_id", saved.admin_user_id)
      .eq(
        "encrypted_refresh_token",
        saved.encrypted_refresh_token
      )
      .eq(
        "encrypted_access_token",
        saved.encrypted_access_token
      )
      .select("id");

  if (updateError) {
    throw new Error(
      "Unable to save refreshed Outlook credentials."
    );
  }

  if (!updated || updated.length === 0) {
    throw new Error(
      "Outlook credentials changed during refresh. Please retry."
    );
  }

  return tokens.access_token;
}

// Used by authenticated administrator actions.
export async function getMicrosoftAccessToken(): Promise<string> {
  const { user, database } = await requireAdmin();

  return resolveMicrosoftAccessToken(
    database,
    user.id
  );
}

// Used exclusively by trusted server-side processors.
// Calling routes must enforce their own authentication.
export async function getBackgroundMicrosoftAccessToken(): Promise<string> {
  const database = createAdminDatabase();

  return resolveMicrosoftAccessToken(database);
}
