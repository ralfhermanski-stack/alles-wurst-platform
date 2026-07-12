/**
 * @file pending-login-token.ts
 * @purpose Kurzlebiges Token zwischen Passwort- und TOTP-Schritt.
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { getSessionSecret } from "@/lib/auth/session-secret";

const PENDING_LOGIN_TTL_MS = 5 * 60_000;

type PendingLoginPayload = {
  userId: string;
  exp: number;
  nonce: string;
};

function signPayload(payloadB64: string): string {
  return createHmac("sha256", getSessionSecret()).update(payloadB64).digest("hex");
}

export function createPendingLoginToken(userId: string): string {
  const payload: PendingLoginPayload = {
    userId,
    exp: Date.now() + PENDING_LOGIN_TTL_MS,
    nonce: randomBytes(16).toString("hex"),
  };

  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(data);

  return `${data}.${signature}`;
}

export function verifyPendingLoginToken(token: string): string | null {
  const separator = token.lastIndexOf(".");

  if (separator <= 0) {
    return null;
  }

  const data = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expected = signPayload(data);

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

  try {
    const payload = JSON.parse(
      Buffer.from(data, "base64url").toString("utf8"),
    ) as PendingLoginPayload;

    if (
      typeof payload.userId !== "string"
      || typeof payload.exp !== "number"
      || payload.exp < Date.now()
    ) {
      return null;
    }

    return payload.userId;
  } catch {
    return null;
  }
}
