/**
 * @file email-crypto.ts
 * @purpose Verschlüsselung für E-Mail-Provider-Zugangsdaten.
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const SALT = "alles-wurst-email-credentials-v1";

function getEncryptionKey(): Buffer {
  const secret =
    process.env.EMAIL_ENCRYPTION_SECRET?.trim() ??
    process.env.AUTH_SESSION_SECRET?.trim();

  if (!secret || secret.length < 32) {
    throw new Error(
      "E-Mail-Zugangsdaten können nicht gespeichert werden: AUTH_SESSION_SECRET fehlt oder ist zu kurz.",
    );
  }

  return scryptSync(secret, SALT, 32);
}

export function encryptEmailCredentialPayload(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptEmailCredentialPayload(encoded: string): string {
  const key = getEncryptionKey();
  const buffer = Buffer.from(encoded, "base64");

  if (buffer.length < 29) {
    throw new Error("Ungültige verschlüsselte E-Mail-Zugangsdaten.");
  }

  const iv = buffer.subarray(0, 12);
  const tag = buffer.subarray(12, 28);
  const encrypted = buffer.subarray(28);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString(
    "utf8",
  );
}

export function maskSecret(value: string, visibleTail = 4): string {
  if (value.length <= visibleTail) {
    return "••••";
  }

  return `${value.slice(0, Math.min(8, value.length - visibleTail))}••••${value.slice(-visibleTail)}`;
}
