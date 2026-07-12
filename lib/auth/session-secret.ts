/**
 * @file session-secret.ts
 * @purpose Session-Geheimnis ohne Node- oder Prisma-Abhängigkeiten (Edge-kompatibel).
 */

export function getSessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET;

  if ((!secret || secret.length < 32) && process.env.NODE_ENV === "development") {
    return "dev-auth-session-secret-fallback-change-me-please-32plus";
  }

  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SESSION_SECRET fehlt oder ist zu kurz (mindestens 32 Zeichen).",
    );
  }

  return secret;
}
