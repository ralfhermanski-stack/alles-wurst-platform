/**
 * @file share-token.ts
 */

import { randomBytes } from "node:crypto";

import type { ShareContentType } from "@prisma/client";

export function generateShareToken(): string {
  return randomBytes(12).toString("base64url");
}

export function getSharePathSegment(contentType: ShareContentType): string {
  if (contentType === "CERTIFICATE") return "certificate";
  if (contentType === "DIPLOMA") return "diploma";
  return "recipe";
}

export function buildShareUrl(contentType: ShareContentType, shareToken: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${base}/share/${getSharePathSegment(contentType)}/${shareToken}`;
}

export function buildShareOgImageUrl(shareToken: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${base}/api/og/share/${shareToken}`;
}
