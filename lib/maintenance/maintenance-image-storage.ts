/**
 * @file maintenance-image-storage.ts
 * @purpose Dateispeicher für Wartungsmodus-Bilder (Logo, Hintergrund).
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "maintenance-images");
const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type MaintenanceImageKind = "logo" | "background";

export function resolveMaintenanceImagePath(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized.includes("..")) {
    throw new Error("Ungültiger Speicherpfad.");
  }

  return path.join(STORAGE_ROOT, normalized);
}

export function isAllowedMaintenanceImageMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function getMaintenanceImageMaxBytes(): number {
  return MAX_BYTES;
}

export function getMaintenanceImagePublicUrl(kind: MaintenanceImageKind): string {
  return `/api/maintenance/images/${kind}`;
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/png") return ".png";
  return ".jpg";
}

export async function saveMaintenanceImage(
  kind: MaintenanceImageKind,
  fileName: string,
  mimeType: string,
  bytes: Uint8Array,
): Promise<{ storageKey: string; fileName: string; mimeType: string }> {
  if (!isAllowedMaintenanceImageMimeType(mimeType)) {
    throw new Error("Nur JPEG, PNG oder WebP sind erlaubt.");
  }

  if (bytes.byteLength > MAX_BYTES) {
    throw new Error("Das Bild darf maximal 5 MB groß sein.");
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const ext = extensionForMimeType(mimeType);
  const storageKey = path.posix.join(
    kind,
    `${kind}-${Date.now()}${ext}`,
  );
  const absolutePath = resolveMaintenanceImagePath(storageKey);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes);

  return {
    storageKey,
    fileName: safeName,
    mimeType,
  };
}

export async function readMaintenanceImageBytes(
  storageKey: string,
): Promise<Uint8Array> {
  const absolutePath = resolveMaintenanceImagePath(storageKey);
  return readFile(absolutePath);
}
