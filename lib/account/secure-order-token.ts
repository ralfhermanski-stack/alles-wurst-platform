/**
 * @file secure-order-token.ts
 * @purpose Kurzlebige signierte Tokens für Bestellbezüge (Widerruf).
 */

import { createHmac, timingSafeEqual } from "node:crypto";

import { getSessionSecret } from "@/lib/auth/session-secret";

const TOKEN_TTL_MS = 30 * 60 * 1000;

type OrderTokenPayload = {
  userId: string;
  orderId: string;
  exp: number;
};

function signPayload(encoded: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest("base64url");
}

export function createOrderAccessToken(
  userId: string,
  orderId: string,
): string {
  const payload: OrderTokenPayload = {
    userId,
    orderId,
    exp: Date.now() + TOKEN_TTL_MS,
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(encoded);

  return `${encoded}.${signature}`;
}

export function verifyOrderAccessToken(
  token: string,
): OrderTokenPayload | null {
  const [encoded, signature] = token.split(".");

  if (!encoded || !signature) {
    return null;
  }

  const expected = signPayload(encoded);

  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);

    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as OrderTokenPayload;

    if (!payload.userId || !payload.orderId || !payload.exp) {
      return null;
    }

    if (payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
