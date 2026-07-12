/**
 * @file certificate-storage.ts
 * @purpose Dateispeicher für Zertifikats-Hintergründe.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "certificate-templates");

export function resolveCertificateBackgroundPath(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized.includes("..")) {
    throw new Error("Ungültiger Speicherpfad.");
  }

  return path.join(STORAGE_ROOT, normalized);
}

export async function saveCertificateBackground(
  fileName: string,
  bytes: Uint8Array,
): Promise<{ storageKey: string; fileName: string }> {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = `background-${Date.now()}-${safeName}`;
  const absolutePath = resolveCertificateBackgroundPath(storageKey);

  await mkdir(STORAGE_ROOT, { recursive: true });
  await writeFile(absolutePath, bytes);

  return { storageKey, fileName: safeName };
}
