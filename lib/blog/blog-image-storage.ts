/**
 * @file blog-image-storage.ts
 * @purpose Dateispeicher für Blog-Beitragsbilder (WebP/JPEG/PNG).
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "blog-images");
const MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function resolveBlogImagePath(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized.includes("..")) {
    throw new Error("Ungültiger Speicherpfad.");
  }

  return path.join(STORAGE_ROOT, normalized);
}

export function isAllowedBlogImageMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function getBlogImageMaxBytes(): number {
  return MAX_BYTES;
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/png") return ".png";
  return ".jpg";
}

export async function saveBlogCoverImage(
  postId: string,
  fileName: string,
  mimeType: string,
  bytes: Uint8Array,
): Promise<{ storageKey: string; fileName: string; mimeType: string }> {
  if (!isAllowedBlogImageMimeType(mimeType)) {
    throw new Error("Nur JPEG, PNG oder WebP sind erlaubt.");
  }

  if (bytes.byteLength > MAX_BYTES) {
    throw new Error("Das Bild darf maximal 5 MB groß sein.");
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const ext = extensionForMimeType(mimeType);
  const storageKey = path.posix.join(
    postId,
    `cover-${Date.now()}${ext}`,
  );
  const absolutePath = resolveBlogImagePath(storageKey);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes);

  return {
    storageKey,
    fileName: safeName,
    mimeType,
  };
}

export async function readBlogImageBytes(storageKey: string): Promise<Uint8Array> {
  const absolutePath = resolveBlogImagePath(storageKey);
  return readFile(absolutePath);
}

export function getBlogCoverPublicUrl(
  postId: string,
  options?: { allowDraft?: boolean },
): string {
  const base = `/api/blog/images/${postId}`;

  if (options?.allowDraft) {
    return `${base}?preview=${postId}`;
  }

  return base;
}

export function resolveBlogCoverUrl(
  post: { id: string; coverStorageKey: string | null; status: string },
): string | null {
  if (!post.coverStorageKey) {
    return null;
  }

  return getBlogCoverPublicUrl(post.id, {
    allowDraft: post.status !== "published",
  });
}
