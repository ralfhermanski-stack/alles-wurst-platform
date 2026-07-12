/**
 * @file totp-crypto.ts
 * @purpose TOTP (RFC 6238) — Google Authenticator kompatibel.
 */

import { createHmac, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateTotpSecret(length = 20): string {
  const bytes = randomBytes(length);
  let secret = "";

  for (let index = 0; index < bytes.length; index += 1) {
    secret += BASE32_ALPHABET[bytes[index] % 32];
  }

  return secret;
}

function base32Decode(secret: string): Buffer {
  const normalized = secret.replace(/=+$/g, "").toUpperCase();
  let bits = "";

  for (const char of normalized) {
    const value = BASE32_ALPHABET.indexOf(char);

    if (value < 0) {
      continue;
    }

    bits += value.toString(2).padStart(5, "0");
  }

  const bytes: number[] = [];

  for (let index = 0; index + 8 <= bits.length; index += 8) {
    bytes.push(parseInt(bits.slice(index, index + 8), 2));
  }

  return Buffer.from(bytes);
}

export function generateTotpCode(secret: string, timeStep = 30, digits = 6): string {
  const counter = Math.floor(Date.now() / 1000 / timeStep);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));

  const key = base32Decode(secret);
  const hmac = createHmac("sha1", key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24)
    | ((hmac[offset + 1] & 0xff) << 16)
    | ((hmac[offset + 2] & 0xff) << 8)
    | (hmac[offset + 3] & 0xff);

  return String(code % 10 ** digits).padStart(digits, "0");
}

export function verifyTotpCode(
  secret: string,
  code: string,
  window = 1,
): boolean {
  const normalized = code.replace(/\s/g, "");

  if (!/^\d{6}$/.test(normalized)) {
    return false;
  }

  for (let drift = -window; drift <= window; drift += 1) {
    const counter = Math.floor(Date.now() / 1000 / 30) + drift;
    const buffer = Buffer.alloc(8);
    buffer.writeBigUInt64BE(BigInt(counter));

    const key = base32Decode(secret);
    const hmac = createHmac("sha1", key).update(buffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const value =
      ((hmac[offset] & 0x7f) << 24)
      | ((hmac[offset + 1] & 0xff) << 16)
      | ((hmac[offset + 2] & 0xff) << 8)
      | (hmac[offset + 3] & 0xff);
    const expected = String(value % 1_000_000).padStart(6, "0");

    if (timingSafeEqual(Buffer.from(expected), Buffer.from(normalized))) {
      return true;
    }
  }

  return false;
}

export function buildTotpUri(input: {
  secret: string;
  email: string;
  issuer?: string;
}): string {
  const issuer = encodeURIComponent(input.issuer ?? "Alles Wurst");
  const label = encodeURIComponent(`${input.issuer ?? "Alles Wurst"}:${input.email}`);

  return `otpauth://totp/${label}?secret=${input.secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
}

export async function encryptTotpSecret(secret: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const key = (await scryptAsync(getTotpEncryptionKey(), salt, 32)) as Buffer;
  const encrypted = Buffer.from(
    Buffer.from(secret).map((byte, index) => byte ^ key[index % key.length]),
  ).toString("base64");

  return `scrypt:${salt}:${encrypted}`;
}

export async function decryptTotpSecret(encrypted: string): Promise<string> {
  const [, salt, payload] = encrypted.split(":");

  if (!salt || !payload) {
    throw new Error("Ungültiges TOTP-Secret-Format.");
  }

  const key = (await scryptAsync(getTotpEncryptionKey(), salt, 32)) as Buffer;
  const bytes = Buffer.from(payload, "base64");

  return Buffer.from(
    bytes.map((byte, index) => byte ^ key[index % key.length]),
  ).toString("utf8");
}

function getTotpEncryptionKey(): string {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!secret || secret.length < 32) {
    return "dev-totp-encryption-key-change-me-32chars-min";
  }

  return secret;
}

export function generateBackupCodes(count = 8): string[] {
  const codes: string[] = [];

  for (let index = 0; index < count; index += 1) {
    const part1 = randomBytes(2).toString("hex").toUpperCase();
    const part2 = randomBytes(2).toString("hex").toUpperCase();
    codes.push(`${part1}-${part2}`);
  }

  return codes;
}

export async function hashBackupCode(code: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(code.replace(/\s/g, "").toUpperCase(), salt, 32)) as Buffer;
  return `scrypt:${salt}:${derived.toString("hex")}`;
}

export async function verifyBackupCodeHash(code: string, hash: string): Promise<boolean> {
  const [, salt, expectedHex] = hash.split(":");

  if (!salt || !expectedHex) {
    return false;
  }

  const derived = (await scryptAsync(code.replace(/\s/g, "").toUpperCase(), salt, 32)) as Buffer;
  const expected = Buffer.from(expectedHex, "hex");

  if (derived.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(derived, expected);
}
