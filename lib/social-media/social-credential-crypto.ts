/**
 * @file social-credential-crypto.ts
 * @purpose Verschlüsselung für Social-Media-Zugangsdaten (AES-256-GCM).
 */

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const SALT = "alles-wurst-social-credentials-v1";

function getEncryptionKey(): Buffer {
  const secret =
    process.env.SOCIAL_MEDIA_ENCRYPTION_SECRET?.trim() ??
    process.env.STRIPE_KEY_ENCRYPTION_SECRET?.trim() ??
    process.env.AUTH_SESSION_SECRET?.trim();

  if (!secret || secret.length < 32) {
    throw new Error(
      "Social-Media-Zugangsdaten können nicht gespeichert werden: Verschlüsselungsgeheimnis fehlt.",
    );
  }

  return scryptSync(secret, SALT, 32);
}

export function encryptSocialCredential(plaintext: string): string {
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

export function decryptSocialCredential(encoded: string): string {
  const key = getEncryptionKey();
  const buffer = Buffer.from(encoded, "base64");

  if (buffer.length < 29) {
    throw new Error("Ungültige verschlüsselte Zugangsdaten.");
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

export function maskSecretValue(value: string): string {
  const trimmed = value.trim();

  if (trimmed.length <= 8) {
    return "••••••••";
  }

  return `${trimmed.slice(0, 4)}••••••••${trimmed.slice(-4)}`;
}
