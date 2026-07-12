/**
 * @file course-group-storage.ts
 * @purpose Dateispeicher für Kursgruppen-Bilder.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "course-groups");

export function resolveCourseGroupImagePath(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized.includes("..")) {
    throw new Error("Ungültiger Speicherpfad.");
  }

  return path.join(STORAGE_ROOT, normalized);
}

export async function saveCourseGroupImage(
  entityId: string,
  kind: "group" | "subgroup",
  fileName: string,
  bytes: Uint8Array,
): Promise<{ storageKey: string; fileName: string }> {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = path.posix.join(
    kind,
    entityId,
    `image-${Date.now()}-${safeName}`,
  );
  const absolutePath = resolveCourseGroupImagePath(storageKey);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes);

  return { storageKey, fileName: safeName };
}

export function isAllowedCourseGroupImageMime(mime: string): boolean {
  return (
    mime === "image/jpeg" ||
    mime === "image/png" ||
    mime === "image/webp" ||
    mime === "image/jpg"
  );
}

const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

export function isAllowedCourseGroupImageFile(
  fileName: string,
  mime: string,
): boolean {
  if (isAllowedCourseGroupImageMime(mime)) {
    return true;
  }

  const lower = fileName.toLowerCase();

  return ALLOWED_IMAGE_EXTENSIONS.some((extension) =>
    lower.endsWith(extension),
  );
}
