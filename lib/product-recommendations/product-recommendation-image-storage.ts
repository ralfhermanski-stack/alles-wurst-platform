/**
 * @file product-recommendation-image-storage.ts
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "product-recommendations");
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export function resolveProductRecommendationImagePath(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized.includes("..")) {
    throw new Error("Ungültiger Speicherpfad.");
  }

  return path.join(STORAGE_ROOT, normalized);
}

export function isAllowedProductImageMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType === "image/webp") return ".webp";
  if (mimeType === "image/png") return ".png";
  return ".jpg";
}

export async function saveProductRecommendationImage(
  entityId: string,
  fileName: string,
  mimeType: string,
  bytes: Uint8Array,
  prefix = "image",
): Promise<{ storageKey: string; fileName: string; mimeType: string }> {
  if (!isAllowedProductImageMimeType(mimeType)) {
    throw new Error("Nur JPEG, PNG oder WebP sind erlaubt.");
  }

  if (bytes.byteLength > MAX_BYTES) {
    throw new Error("Das Bild darf maximal 5 MB groß sein.");
  }

  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const ext = extensionForMimeType(mimeType);
  const storageKey = path.posix.join(entityId, `${prefix}-${Date.now()}${ext}`);
  const absolutePath = resolveProductRecommendationImagePath(storageKey);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes);

  return { storageKey, fileName: safeName, mimeType };
}

export async function readProductRecommendationImageBytes(
  storageKey: string,
): Promise<Uint8Array> {
  return readFile(resolveProductRecommendationImagePath(storageKey));
}

export function getProductImagePublicUrl(productId: string, kind: "main" | "gallery" = "main", imageId?: string): string {
  if (kind === "gallery" && imageId) {
    return `/api/werkstatt/empfehlungen/images/${productId}/gallery/${imageId}`;
  }

  return `/api/werkstatt/empfehlungen/images/${productId}/main`;
}

export function getCategoryPlaceholderPublicUrl(categoryId: string): string {
  return `/api/werkstatt/empfehlungen/images/category/${categoryId}`;
}
