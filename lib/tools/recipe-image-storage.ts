/**
 * @file recipe-image-storage.ts
 * @purpose Dateispeicher für Rezeptbilder.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "recipe-images");

export function resolveRecipeImagePath(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized.includes("..")) {
    throw new Error("Ungültiger Speicherpfad.");
  }

  return path.join(STORAGE_ROOT, normalized);
}

export async function saveRecipeImage(
  recipeId: string,
  fileName: string,
  bytes: Uint8Array,
): Promise<{ storageKey: string; fileName: string }> {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = path.posix.join(recipeId, `image-${Date.now()}-${safeName}`);
  const absolutePath = resolveRecipeImagePath(storageKey);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes);

  return { storageKey, fileName: safeName };
}

export function guessImageMimeType(storageKey: string): string {
  const ext = path.extname(storageKey).toLowerCase();

  if (ext === ".png") {
    return "image/png";
  }

  if (ext === ".webp") {
    return "image/webp";
  }

  if (ext === ".gif") {
    return "image/gif";
  }

  return "image/jpeg";
}
