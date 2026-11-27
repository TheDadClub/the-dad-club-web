
import "server-only";

const MICROSOFT_GRAPH_SCOPES = [
  "openid",
  "profile",
  "offline_access",
  "User.Read",
  "Mail.Read",
];

export function getMicrosoftConfig() {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = process.env.MICROSOFT_TENANT_ID;

  if (!clientId || !clientSecret || !tenantId) {
    throw new Error(
      "Microsoft authentication configuration is missing."
    );
  }

  return {
    clientId,
    clientSecret,
    tenantId,
    scopes: MICROSOFT_GRAPH_SCOPES,
    authority: `https://login.microsoftonline.com/${tenantId}`,
  };
}

export function getMicrosoftRedirectUri(
  origin: string
) {
  const url = new URL(origin);

  const allowedOrigins = [
    "http://localhost:3000",
    "https://thedadclub.com.au",
  ];

  if (!allowedOrigins.includes(url.origin)) {
    throw new Error(
      "Microsoft authentication origin is not allowed."
    );
  }

  return `${url.origin}/api/auth/microsoft/callback`;
}
