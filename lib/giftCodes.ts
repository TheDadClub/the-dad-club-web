import "server-only";

import {
  createHash,
  createHmac,
} from "node:crypto";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function buildGiftCode(
  orderId: string,
  environment: "sandbox" | "live",
) {
  if (!uuidPattern.test(orderId)) {
    throw new Error("Invalid gift order reference.");
  }

  const secret = process.env.GIFT_CODE_SECRET?.trim();

  if (!secret || !/^[a-f0-9]{64}$/i.test(secret)) {
    throw new Error("Gift code configuration is missing.");
  }

  const value = createHmac(
    "sha256",
    Buffer.from(secret, "hex"),
  )
    .update(
      `dad-club-gift/v1/${environment}/${orderId.toLowerCase()}`,
    )
    .digest("hex")
    .slice(0, 32)
    .toUpperCase();

  const groups = value.match(/.{8}/g);

  if (!groups) {
    throw new Error("Gift code could not be generated.");
  }

  return `DAD-${groups.join("-")}`;
}

export function hashGiftCode(value: string): string | null {
  if (value.length > 100) {
    return null;
  }

  const normalised = value
    .toUpperCase()
    .replace(/[\s-]/g, "");

  if (!/^DAD[A-F0-9]{32}$/.test(normalised)) {
    return null;
  }

  return createHash("sha256")
    .update(normalised)
    .digest("hex");
}