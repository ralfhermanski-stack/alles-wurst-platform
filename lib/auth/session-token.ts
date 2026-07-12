/**
 * @file session-constants.ts
 * @purpose Gemeinsame Session-Konstanten (Edge- und Node-kompatibel).
 */

import type { UserSystemRole } from "@prisma/client";

import { getSessionSecret } from "./session-secret";

export const SESSION_COOKIE_NAME = "aw_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export type SessionSystemRole = UserSystemRole;

export type SessionPayload = {
  userId: string;
  exp: number;
  systemRole?: SessionSystemRole;
  maintenanceBypass?: boolean;
  sessionId?: string;
};

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

async function signData(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(data),
  );

  return toBase64Url(new Uint8Array(signature));
}

/**
 * Erzeugt ein signiertes Session-Token (Web Crypto — Edge-kompatibel).
 */
export async function createSessionToken(
  userId: string,
  systemRole: SessionSystemRole = "USER",
  maintenanceBypass = false,
  sessionId?: string,
): Promise<string> {
  const payload: SessionPayload = {
    userId,
    systemRole,
    maintenanceBypass: maintenanceBypass || undefined,
    sessionId: sessionId || undefined,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };

  const data = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await signData(data, getSessionSecret());

  return `${data}.${signature}`;
}

/**
 * Verifiziert ein Session-Token (Web Crypto — Edge-kompatibel).
 */
export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  const separatorIndex = token.lastIndexOf(".");

  if (separatorIndex <= 0) {
    return null;
  }

  const data = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);

  if (!data || !signature) {
    return null;
  }

  try {
    const expected = await signData(data, getSessionSecret());

    if (signature.length !== expected.length) {
      return null;
    }

    let mismatch = 0;

    for (let index = 0; index < signature.length; index += 1) {
      mismatch |= signature.charCodeAt(index) ^ expected.charCodeAt(index);
    }

    if (mismatch !== 0) {
      return null;
    }

    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(data)),
    ) as SessionPayload;

    if (
      typeof payload.userId !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    if (
      payload.systemRole !== undefined &&
      payload.systemRole !== "USER" &&
      payload.systemRole !== "ADMIN" &&
      payload.systemRole !== "SUPERADMIN" &&
      payload.systemRole !== "SUPPORT" &&
      payload.systemRole !== "INSTRUCTOR"
    ) {
      return null;
    }

    if (
      payload.maintenanceBypass !== undefined &&
      typeof payload.maintenanceBypass !== "boolean"
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
