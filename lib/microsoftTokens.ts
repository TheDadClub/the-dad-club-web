
import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const hexKey =
    process.env.MICROSOFT_TOKEN_ENCRYPTION_KEY;

  if (!hexKey || !/^[a-fA-F0-9]{64}$/.test(hexKey)) {
    throw new Error(
      "Microsoft token encryption key is missing or invalid."
    );
  }

  return Buffer.from(hexKey, "hex");
}

export function encryptMicrosoftToken(
  plaintext: string
): string {
  if (!plaintext) {
    throw new Error("Cannot encrypt an empty token.");
  }

  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(
    ALGORITHM,
    getEncryptionKey(),
    iv
  );

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return [
    "v1",
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptMicrosoftToken(
  storedValue: string
): string {
  const parts = storedValue.split(".");

  if (parts.length !== 4 || parts[0] !== "v1") {
    throw new Error(
      "Unsupported Microsoft token encryption format."
    );
  }

  const [, ivValue, tagValue, encryptedValue] =
    parts;

  const iv = Buffer.from(ivValue, "base64url");
  const authTag = Buffer.from(
    tagValue,
    "base64url"
  );

  const encrypted = Buffer.from(
    encryptedValue,
    "base64url"
  );

  if (
    iv.length !== IV_LENGTH ||
    authTag.length !== AUTH_TAG_LENGTH
  ) {
    throw new Error(
      "Invalid Microsoft token encryption data."
    );
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    getEncryptionKey(),
    iv
  );

  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}
