/**
 * @file secure-export-download-token.ts
 * @purpose Signierte Download-Tokens für Datenexporte (E-Mail-Link, 7 Tage).
 */

import { createHmac, timingSafeEqual } from "node:crypto";

import { getSessionSecret } from "@/lib/auth/session-secret";

const EXPORT_DOWNLOAD_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type ExportDownloadTokenPayload = {
  userId: string;
  exportId: string;
  exp: number;
};

function signPayload(encoded: string): string {
  return createHmac("sha256", getSessionSecret())
    .update(encoded)
    .digest("base64url");
}

export function createDataExportDownloadToken(
  userId: string,
  exportId: string,
): string {
  const payload: ExportDownloadTokenPayload = {
    userId,
    exportId,
    exp: Date.now() + EXPORT_DOWNLOAD_TTL_MS,
  };

  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(encoded);

  return `${encoded}.${signature}`;
}

export function verifyDataExportDownloadToken(
  token: string,
): ExportDownloadTokenPayload | null {
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
    ) as ExportDownloadTokenPayload;

    if (!payload.userId || !payload.exportId || !payload.exp) {
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
