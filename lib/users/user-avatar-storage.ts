/**
 * @file user-avatar-storage.ts
 * @purpose Dateispeicher für Nutzer-Avatare.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  MAX_AVATAR_BYTES,
  MAX_AVATAR_SIZE_LABEL,
} from "@/lib/users/user-avatar-limits";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "user-avatars");

export function buildPublicAvatarUrl(userId: string): string {
  return `/api/users/${userId}/avatar`;
}

export function resolveUserAvatarPath(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized.includes("..")) {
    throw new Error("Ungültiger Speicherpfad.");
  }

  return path.join(STORAGE_ROOT, normalized);
}

export async function saveUserAvatar(
  userId: string,
  fileName: string,
  bytes: Uint8Array,
): Promise<{ storageKey: string; fileName: string }> {
  if (bytes.byteLength > MAX_AVATAR_BYTES) {
    throw new Error(`Avatar ist zu groß (max. ${MAX_AVATAR_SIZE_LABEL}).`);
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = path.posix.join(userId, `avatar-${Date.now()}-${safeName}`);
  const absolutePath = resolveUserAvatarPath(storageKey);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes);

  return { storageKey, fileName: safeName };
}

export function isAllowedAvatarFile(fileName: string, mime: string): boolean {
  const allowedMime = new Set([
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ]);

  if (allowedMime.has(mime)) {
    return true;
  }

  const lower = fileName.toLowerCase();

  return [".jpg", ".jpeg", ".png", ".webp"].some((ext) => lower.endsWith(ext));
}

export function guessAvatarMimeType(storageKey: string): string {
  const ext = path.extname(storageKey).toLowerCase();

  if (ext === ".png") {
    return "image/png";
  }

  if (ext === ".webp") {
    return "image/webp";
  }

  return "image/jpeg";
}
