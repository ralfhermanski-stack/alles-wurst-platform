/**
 * @file platform-image-storage.ts
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "platform");
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 1920;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function isAllowedPlatformImageMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

export function getPlatformImageMaxBytes(): number {
  return MAX_BYTES;
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType === "image/webp") {
    return ".webp";
  }

  if (mimeType === "image/png") {
    return ".png";
  }

  return ".jpg";
}

async function optimizePlatformImageBytes(
  bytes: Uint8Array,
  mimeType: string,
): Promise<{ bytes: Uint8Array; mimeType: string }> {
  try {
    const sharp = (await import("sharp")).default;
    const pipeline = sharp(Buffer.from(bytes), { failOn: "none" }).rotate();
    const metadata = await pipeline.metadata();

    if ((metadata.width ?? 0) <= MAX_IMAGE_WIDTH) {
      return { bytes, mimeType };
    }

    if (mimeType === "image/png") {
      const output = await pipeline
        .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
        .png({ compressionLevel: 9 })
        .toBuffer();

      return { bytes: new Uint8Array(output), mimeType: "image/png" };
    }

    if (mimeType === "image/webp") {
      const output = await pipeline
        .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();

      return { bytes: new Uint8Array(output), mimeType: "image/webp" };
    }

    const output = await pipeline
      .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toBuffer();

    return { bytes: new Uint8Array(output), mimeType: "image/jpeg" };
  } catch {
    return { bytes, mimeType };
  }
}

export async function savePlatformImage(input: {
  textKey: string;
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
}): Promise<string> {
  if (!isAllowedPlatformImageMimeType(input.mimeType)) {
    throw new Error("Nur JPEG, PNG oder WebP sind erlaubt.");
  }

  if (input.bytes.byteLength > MAX_BYTES) {
    throw new Error("Das Bild darf maximal 5 MB groß sein.");
  }

  const optimized = await optimizePlatformImageBytes(input.bytes, input.mimeType);

  if (optimized.bytes.byteLength > MAX_BYTES) {
    throw new Error("Das Bild darf maximal 5 MB groß sein.");
  }

  const safeKey = input.textKey.replace(/[^a-z0-9._-]/gi, "_").slice(0, 80);
  const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 40);
  const fileName = `${safeKey}-${safeName}-${Date.now()}${extensionForMimeType(optimized.mimeType)}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, fileName), optimized.bytes);

  return `/uploads/platform/${fileName}`;
}
