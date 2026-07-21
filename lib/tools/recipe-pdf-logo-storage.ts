/**
 * @file recipe-pdf-logo-storage.ts
 * @purpose Dateispeicher für das globale Rezept-PDF-Logo.
 */

import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "recipe-pdf-logos");
const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function getRecipePdfLogoPublicUrl(): string {
  return "/api/tools/recipes/pdf-logo";
}

export function isAllowedRecipePdfLogoMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function getRecipePdfLogoMaxBytes(): number {
  return MAX_BYTES;
}

export function resolveRecipePdfLogoPath(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized.includes("..")) {
    throw new Error("Ungültiger Speicherpfad.");
  }

  return path.join(STORAGE_ROOT, normalized);
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/png") return ".png";
  return ".jpg";
}

export async function saveRecipePdfLogo(
  fileName: string,
  mimeType: string,
  bytes: Uint8Array,
): Promise<{ storageKey: string; fileName: string; mimeType: string }> {
  if (!isAllowedRecipePdfLogoMimeType(mimeType)) {
    throw new Error("Nur JPEG, PNG oder WebP sind erlaubt.");
  }

  if (bytes.byteLength <= 0 || bytes.byteLength > MAX_BYTES) {
    throw new Error("Das Bild darf maximal 5 MB groß sein.");
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
  const ext = extensionForMimeType(mimeType);
  const storageKey = `pdf-logo-${Date.now()}${ext}`;
  const absolutePath = resolveRecipePdfLogoPath(storageKey);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes);

  return {
    storageKey,
    fileName: safeName || `logo${ext}`,
    mimeType,
  };
}

export async function readRecipePdfLogoBytes(
  storageKey: string,
): Promise<Uint8Array> {
  const absolutePath = resolveRecipePdfLogoPath(storageKey);
  return readFile(absolutePath);
}

export async function deleteRecipePdfLogoFile(
  storageKey: string | null | undefined,
): Promise<void> {
  if (!storageKey) {
    return;
  }

  try {
    await unlink(resolveRecipePdfLogoPath(storageKey));
  } catch {
    // Datei fehlt bereits — ignorieren
  }
}
