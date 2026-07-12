/**
 * @file challenge-media-storage.ts
 * @purpose Sicherer Bild-Upload für Challenge-Einreichungen.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "challenge-submissions");
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGES_PER_SUBMISSION = 5;

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const ALLOWED_EXT = [".jpg", ".jpeg", ".png", ".webp", ".gif"];

export function getMaxChallengeImagesPerSubmission(): number {
  return MAX_IMAGES_PER_SUBMISSION;
}

export function getMaxChallengeImageBytes(): number {
  return MAX_IMAGE_BYTES;
}

export function buildChallengeMediaPublicUrl(mediaId: string): string {
  return `/api/challenges/media/${mediaId}`;
}

export function resolveChallengeMediaPath(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized.includes("..")) {
    throw new Error("Ungültiger Speicherpfad.");
  }

  return path.join(STORAGE_ROOT, normalized);
}

export function isAllowedChallengeImage(
  fileName: string,
  mime: string,
): boolean {
  if (ALLOWED_MIME.has(mime)) {
    return true;
  }

  const lower = fileName.toLowerCase();

  return ALLOWED_EXT.some((ext) => lower.endsWith(ext));
}

export async function saveChallengeSubmissionImage(input: {
  submissionId: string;
  fileName: string;
  bytes: Uint8Array;
  maxBytes?: number;
}): Promise<{ storageKey: string; fileName: string }> {
  const maxBytes = input.maxBytes ?? MAX_IMAGE_BYTES;

  if (input.bytes.byteLength > maxBytes) {
    throw new Error(`Bild ist zu groß (max. ${Math.round(maxBytes / (1024 * 1024))} MB).`);
  }

  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = path.posix.join(
    input.submissionId,
    `${Date.now()}-${safeName}`,
  );
  const absolutePath = resolveChallengeMediaPath(storageKey);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, input.bytes);

  return { storageKey, fileName: safeName };
}

export function guessChallengeImageMimeType(storageKey: string): string {
  const ext = path.extname(storageKey).toLowerCase();

  switch (ext) {
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    default:
      return "image/jpeg";
  }
}
