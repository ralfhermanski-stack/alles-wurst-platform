/**
 * @file support-attachment-storage.ts
 * @purpose Sicherer Dateiupload für Ticket-Anhänge.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "support-attachments");
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_ATTACHMENTS_PER_MESSAGE = 3;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
]);

const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf", ".txt"];

export function getMaxAttachmentsPerMessage(): number {
  return MAX_ATTACHMENTS_PER_MESSAGE;
}

export function getMaxAttachmentBytes(): number {
  return MAX_ATTACHMENT_BYTES;
}

export function resolveSupportAttachmentPath(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized.includes("..")) {
    throw new Error("Ungültiger Speicherpfad.");
  }

  return path.join(STORAGE_ROOT, normalized);
}

export function isAllowedSupportAttachment(
  fileName: string,
  mime: string,
): boolean {
  if (ALLOWED_MIME.has(mime)) {
    return true;
  }

  const lower = fileName.toLowerCase();

  return ALLOWED_EXT.some((ext) => lower.endsWith(ext));
}

export async function saveSupportAttachment(
  ticketId: string,
  fileName: string,
  bytes: Uint8Array,
): Promise<{ storageKey: string; fileName: string }> {
  if (bytes.byteLength > MAX_ATTACHMENT_BYTES) {
    throw new Error("Datei ist zu groß (max. 10 MB).");
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = path.posix.join(
    ticketId,
    `${Date.now()}-${safeName}`,
  );
  const absolutePath = resolveSupportAttachmentPath(storageKey);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes);

  return { storageKey, fileName: safeName };
}

export function guessSupportAttachmentMimeType(storageKey: string): string {
  const ext = path.extname(storageKey).toLowerCase();

  switch (ext) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".pdf":
      return "application/pdf";
    case ".txt":
      return "text/plain";
    default:
      return "image/jpeg";
  }
}
