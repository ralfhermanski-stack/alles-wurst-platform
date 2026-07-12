/**
 * @file session.ts
 * @purpose Session-Cookies für Registrierung und Login (Server).
 */

import { randomUUID } from "node:crypto";

import { cookies } from "next/headers";

import { registerUserSession, isSessionRevoked } from "@/lib/security/session-registry-service";
import { buildSecurityRequestContext } from "@/lib/security/request-context";

import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  type SessionPayload,
  createSessionToken,
  verifySessionToken,
} from "./session-token";

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS };
export type { SessionPayload };

/**
 * Liest die userId aus dem Session-Cookie eines Requests.
 */
export async function getSessionUserIdFromRequest(
  request: Request,
): Promise<string | null> {
  const cookieHeader = request.headers.get("cookie");

  if (!cookieHeader) {
    return null;
  }

  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`));

  if (!match) {
    return null;
  }

  const token = decodeURIComponent(match.slice(SESSION_COOKIE_NAME.length + 1));
  const payload = await verifySessionToken(token);

  if (!payload) {
    return null;
  }

  if (await isSessionRevoked(token)) {
    return null;
  }

  return payload.userId ?? null;
}

/**
 * Setzt das Session-Cookie (Server Action / Route Handler).
 */
export async function setSessionCookie(
  userId: string,
  systemRole: SessionPayload["systemRole"] = "USER",
  maintenanceBypass = false,
  request?: Request,
): Promise<void> {
  const cookieStore = await cookies();
  const sessionId = randomUUID();
  const token = await createSessionToken(
    userId,
    systemRole ?? "USER",
    maintenanceBypass,
    sessionId,
  );

  if (request) {
    const context = buildSecurityRequestContext(request);
    await registerUserSession({
      userId,
      sessionId,
      sessionToken: token,
      context,
    });
  }

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

/**
 * Entfernt das Session-Cookie.
 */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Liest die userId aus dem Server-Cookie-Store.
 */
export async function getSessionUserIdFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);

  if (!payload) {
    return null;
  }

  if (await isSessionRevoked(token)) {
    return null;
  }

  return payload.userId ?? null;
}
