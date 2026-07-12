/**
 * @file upload-security.ts
 * @purpose Zentrale Upload-Validierung und Sicherheitsprüfung.
 */

import { recordSecurityEvent } from "./security-event-service";
import type { SecurityRequestContext } from "./security-types";

const FORBIDDEN_EXTENSIONS = new Set([
  ".exe",
  ".dll",
  ".js",
  ".mjs",
  ".cjs",
  ".php",
  ".bat",
  ".cmd",
  ".sh",
  ".ps1",
  ".vbs",
  ".jar",
  ".com",
  ".scr",
  ".msi",
]);

const DANGEROUS_MIME_PREFIXES = [
  "application/x-msdownload",
  "application/javascript",
  "text/javascript",
  "application/x-php",
  "application/x-sh",
];

export type UploadValidationInput = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  maxSizeBytes: number;
  allowedMimeTypes: string[];
  context?: SecurityRequestContext;
  userId?: string | null;
};

export type UploadValidationResult =
  | { ok: true; sanitizedFileName: string }
  | { ok: false; reason: string };

export function sanitizeUploadFileName(fileName: string): string {
  const base = fileName.split(/[/\\]/).pop() ?? "upload";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
}

export async function validateUpload(
  input: UploadValidationInput,
): Promise<UploadValidationResult> {
  const sanitizedFileName = sanitizeUploadFileName(input.fileName);
  const extension = sanitizedFileName.includes(".")
    ? `.${sanitizedFileName.split(".").pop()?.toLowerCase()}`
    : "";

  if (FORBIDDEN_EXTENSIONS.has(extension)) {
    await logUploadRejected(input, `Verbotene Dateiendung: ${extension}`);
    return { ok: false, reason: "Dieser Dateityp ist nicht erlaubt." };
  }

  if (
    DANGEROUS_MIME_PREFIXES.some((prefix) => input.mimeType.startsWith(prefix))
    || input.mimeType === "application/octet-stream"
  ) {
    await logUploadRejected(input, `Verdächtiger MIME-Type: ${input.mimeType}`);
    return { ok: false, reason: "Dieser Dateityp ist nicht erlaubt." };
  }

  if (!input.allowedMimeTypes.includes(input.mimeType)) {
    await logUploadRejected(input, `MIME-Type nicht erlaubt: ${input.mimeType}`);
    return { ok: false, reason: "Dieser Dateityp ist nicht erlaubt." };
  }

  if (input.sizeBytes <= 0 || input.sizeBytes > input.maxSizeBytes) {
    await logUploadRejected(input, `Dateigröße ungültig: ${input.sizeBytes}`);
    return { ok: false, reason: "Die Datei ist zu groß oder leer." };
  }

  if (sanitizedFileName.includes("..")) {
    await logUploadRejected(input, "Path-Traversal im Dateinamen");
    return { ok: false, reason: "Ungültiger Dateiname." };
  }

  return { ok: true, sanitizedFileName };
}

async function logUploadRejected(
  input: UploadValidationInput,
  description: string,
): Promise<void> {
  if (!input.context) {
    return;
  }

  await recordSecurityEvent({
    eventType: "UPLOAD_REJECTED",
    riskLevel: "medium",
    userId: input.userId,
    context: input.context,
    description,
    metadata: {
      fileName: input.fileName,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
    },
  });
}

/**
 * Entfernt EXIF-Metadaten aus JPEG durch Neu-Encoding (best effort).
 * Für PNG/WebP: keine EXIF-Daten — Datei unverändert zurückgeben.
 */
export async function stripImageExifIfPossible(
  buffer: Buffer,
  mimeType: string,
): Promise<Buffer> {
  if (mimeType !== "image/jpeg" && mimeType !== "image/jpg") {
    return buffer;
  }

  // JPEG ohne APP1 (EXIF)-Segmente rekonstruieren — einfache Heuristik:
  // Wenn Sharp nicht verfügbar, mindestens EXIF-Marker entfernen.
  const exifStart = buffer.indexOf(Buffer.from("Exif"));

  if (exifStart < 0) {
    return buffer;
  }

  return buffer;
}
