/**
 * @file course-cover-storage.ts
 * @purpose Dateispeicher für Kurs-Coverbilder.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "course-covers");

export function resolveCourseCoverPath(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized.includes("..")) {
    throw new Error("Ungültiger Speicherpfad.");
  }

  return path.join(STORAGE_ROOT, normalized);
}

export async function saveCourseCover(
  courseId: string,
  fileName: string,
  bytes: Uint8Array,
): Promise<{ storageKey: string; fileName: string }> {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = path.posix.join(courseId, `cover-${Date.now()}-${safeName}`);
  const absolutePath = resolveCourseCoverPath(storageKey);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes);

  return { storageKey, fileName: safeName };
}
