import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
} from "node:crypto";
import { cookies } from "next/headers";

const cookieName = "dad_club_gift_redemption";
const lifetimeSeconds = 15 * 60;

export type GiftDelivery = {
  name: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: "AU";
  };
};

export type PendingGiftRedemption = {
  codeHash: string;
  name: string;
  email: string;
  shipping: GiftDelivery;
};

function encryptionKey() {
  const secret = process.env.GIFT_CODE_SECRET?.trim();

  if (!secret || !/^[a-f0-9]{64}$/i.test(secret)) {
    throw new Error("Gift configuration is missing.");
  }

  return createHmac(
    "sha256",
    Buffer.from(secret, "hex"),
  )
    .update("dad-club/pending-gift/v1")
    .digest();
}

function object(value: unknown): Record<string, unknown> {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function validText(
  value: unknown,
  minimum: number,
  maximum: number,
) {
  return (
    typeof value === "string" &&
    value === value.trim() &&
    value.length >= minimum &&
    value.length <= maximum
  );
}

function validDetails(
  value: unknown,
): value is PendingGiftRedemption {
  const details = object(value);
  const shipping = object(details.shipping);
  const address = object(shipping.address);

  return (
    typeof details.codeHash === "string" &&
    /^[a-f0-9]{64}$/.test(details.codeHash) &&
    validText(details.name, 1, 100) &&
    validText(details.email, 3, 254) &&
    typeof details.email === "string" &&
    details.email === details.email.toLowerCase() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email) &&
    validText(shipping.name, 1, 200) &&
    validText(address.line1, 1, 200) &&
    validText(address.line2, 0, 200) &&
    validText(address.city, 1, 100) &&
    typeof address.state === "string" &&
    ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"].includes(
      address.state,
    ) &&
    typeof address.postal_code === "string" &&
    /^[0-9]{4}$/.test(address.postal_code) &&
    address.country === "AU"
  );
}

export async function savePendingGiftRedemption(
  details: PendingGiftRedemption,
) {
  if (!validDetails(details)) {
    throw new Error("Invalid gift redemption details.");
  }

  const payload = Buffer.from(
    JSON.stringify({
      expiresAt: Date.now() + lifetimeSeconds * 1000,
      details,
    }),
    "utf8",
  );

  // Keep the encrypted value comfortably within cookie limits.
  if (payload.length > 2400) {
    throw new Error("Gift redemption details are too long.");
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    encryptionKey(),
    iv,
  );

  const encrypted = Buffer.concat([
    cipher.update(payload),
    cipher.final(),
  ]);

  const value = [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");

  const jar = await cookies();

  jar.set(cookieName, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/redeem",
    maxAge: lifetimeSeconds,
  });
}

export async function readPendingGiftRedemption():
  Promise<PendingGiftRedemption | null> {
  try {
    const jar = await cookies();
    const value = jar.get(cookieName)?.value;

    if (!value || value.length > 4000) {
      return null;
    }

    const parts = value.split(".");

    if (
      parts.length !== 4 ||
      parts[0] !== "v1" ||
      parts.slice(1).some(
        (part) => !/^[A-Za-z0-9_-]+$/.test(part),
      )
    ) {
      return null;
    }

    const iv = Buffer.from(parts[1], "base64url");
    const tag = Buffer.from(parts[2], "base64url");
    const encrypted = Buffer.from(parts[3], "base64url");

    if (iv.length !== 12 || tag.length !== 16) {
      return null;
    }

    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      iv,
    );

    decipher.setAuthTag(tag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);

    if (decrypted.length > 2400) {
      return null;
    }

    const payload = object(
      JSON.parse(decrypted.toString("utf8")),
    );

    if (
      typeof payload.expiresAt !== "number" ||
      !Number.isSafeInteger(payload.expiresAt) ||
      payload.expiresAt <= Date.now() ||
      payload.expiresAt >
        Date.now() + lifetimeSeconds * 1000 + 60_000 ||
      !validDetails(payload.details)
    ) {
      return null;
    }

    return payload.details;
  } catch {
    return null;
  }
}

export async function clearPendingGiftRedemption() {
  const jar = await cookies();

  jar.set(cookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/redeem",
    maxAge: 0,
  });
}