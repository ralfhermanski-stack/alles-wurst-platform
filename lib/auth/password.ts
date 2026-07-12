/**
 * @file password.ts
 * @purpose Sicheres Passwort-Hashing mit Node.js scrypt (ohne zusätzliche Abhängigkeit).
 */

import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

/**
 * Hasht ein Passwort für die Speicherung in `users.password_hash`.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH).toString("hex");
  const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;

  return `scrypt:${salt}:${derived.toString("hex")}`;
}

/**
 * Prüft ein Klartext-Passwort gegen einen gespeicherten Hash.
 */
export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const parts = storedHash.split(":");

  if (parts.length !== 3 || parts[0] !== "scrypt") {
    return false;
  }

  const salt = parts[1];
  const expectedHex = parts[2];

  if (!salt || !expectedHex) {
    return false;
  }

  try {
    const derived = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
    const expected = Buffer.from(expectedHex, "hex");

    if (derived.length !== expected.length) {
      return false;
    }

    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

/**
 * Validiert Passwort-Anforderungen für Registrierung.
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) {
    return "Das Passwort muss mindestens 8 Zeichen lang sein.";
  }

  return null;
}
