/**
 * @file marinade-pdf-storage.ts
 * @purpose Dateispeicher für Marinaden-PDFs (geschützter Download).
 */

import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "recipe-pdfs");

export function resolveMarinadePdfPath(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized.includes("..")) {
    throw new Error("Ungültiger Speicherpfad.");
  }

  return path.join(STORAGE_ROOT, normalized);
}

export async function saveMarinadePdf(
  recipeId: string,
  bytes: Uint8Array,
): Promise<{ storageKey: string }> {
  const storageKey = path.posix.join(recipeId, `marinade-${Date.now()}.pdf`);
  const absolutePath = resolveMarinadePdfPath(storageKey);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes);

  return { storageKey };
}

export async function readMarinadePdf(
  storageKey: string,
): Promise<Uint8Array> {
  const absolutePath = resolveMarinadePdfPath(storageKey);
  return readFile(absolutePath);
}

export async function deleteMarinadePdf(storageKey: string): Promise<void> {
  try {
    const absolutePath = resolveMarinadePdfPath(storageKey);
    await unlink(absolutePath);
  } catch {
    // Datei bereits entfernt — ignorieren
  }
}
