/**
 * @file auth-token.ts
 * @purpose Generierung und Hashing von Einmal-Tokens (E-Mail-Verifikation, Passwort-Reset).
 */

import { createHmac, randomBytes, timingSafeEqual } from "crypto";

import { getSessionSecret } from "./session-secret";

/** Gültigkeit E-Mail-Verifikation: 24 Stunden */
export const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

/** Gültigkeit Passwort-Reset: 1 Stunde */
export const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

/**
 * Erzeugt ein kryptographisch sicheres Klartext-Token (nur für Links/E-Mails).
 */
export function generatePlainToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Hasht ein Klartext-Token für die Speicherung in der Datenbank.
 */
export function hashPlainToken(token: string): string {
  return createHmac("sha256", getSessionSecret()).update(token).digest("hex");
}

/**
 * Vergleicht ein Klartext-Token mit einem gespeicherten Hash (timing-safe).
 */
export function verifyPlainTokenHash(token: string, storedHash: string): boolean {
  const expected = hashPlainToken(token);

  try {
    const tokenBuffer = Buffer.from(expected, "hex");
    const hashBuffer = Buffer.from(storedHash, "hex");

    if (tokenBuffer.length !== hashBuffer.length) {
      return false;
    }

    return timingSafeEqual(tokenBuffer, hashBuffer);
  } catch {
    return false;
  }
}

/**
 * Prüft, ob ein Ablaufdatum noch in der Zukunft liegt.
 */
export function isTokenExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() <= Date.now();
}
