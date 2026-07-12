/**
 * @file course-storage.ts
 * @purpose Dateispeicher für Kurs-Downloads.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "course-downloads");

export function getCourseDownloadStorageRoot(): string {
  return STORAGE_ROOT;
}

export function resolveCourseDownloadPath(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized.includes("..")) {
    throw new Error("Ungültiger Speicherpfad.");
  }

  return path.join(STORAGE_ROOT, normalized);
}

export async function saveCourseDownloadFile(
  courseId: string,
  lessonId: string,
  fileName: string,
  bytes: Uint8Array,
): Promise<{ storageKey: string; fileName: string }> {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = path.posix.join(courseId, lessonId, safeName);
  const absolutePath = resolveCourseDownloadPath(storageKey);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes);

  return { storageKey, fileName: safeName };
}
