/**
 * @file preview-token-edge.ts
 * @purpose Signierte Preview-Tokens — Web Crypto, Edge-kompatibel.
 */

import { getSessionSecret } from "@/lib/auth/session-secret";

import type { PageEditorSessionPayload } from "./page-editor-types";

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

async function signPayload(encodedPayload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(encodedPayload),
  );

  return toBase64Url(new Uint8Array(signature));
}

export async function createPageEditorPreviewToken(
  payload: Omit<PageEditorSessionPayload, "expiresAt"> & { expiresAt: number },
): Promise<string> {
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await signPayload(body);
  return `${body}.${signature}`;
}

export async function verifyPageEditorPreviewToken(
  token: string,
): Promise<PageEditorSessionPayload | null> {
  const separatorIndex = token.lastIndexOf(".");

  if (separatorIndex <= 0) {
    return null;
  }

  const body = token.slice(0, separatorIndex);
  const signature = token.slice(separatorIndex + 1);

  if (!body || !signature) {
    return null;
  }

  try {
    const expected = await signPayload(body);

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

    const parsed = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body)),
    ) as PageEditorSessionPayload;

    if (
      !parsed.sessionId ||
      !parsed.userId ||
      !parsed.pageId ||
      typeof parsed.expiresAt !== "number"
    ) {
      return null;
    }

    if (parsed.expiresAt <= Date.now()) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function generatePageEditorPlainToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}
