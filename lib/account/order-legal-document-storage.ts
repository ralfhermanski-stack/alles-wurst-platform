/**
 * @file order-legal-document-storage.ts
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "order-legal-documents");

export function resolveOrderLegalDocumentPath(storageKey: string): string {
  const normalized = storageKey.replace(/\\/g, "/").replace(/^\/+/, "");

  if (normalized.includes("..")) {
    throw new Error("Ungültiger Speicherpfad.");
  }

  return path.join(STORAGE_ROOT, normalized);
}

export async function saveOrderLegalPdf(
  accountingPositionId: string,
  documentType: string,
  bytes: Uint8Array,
): Promise<{ storageKey: string }> {
  const storageKey = path.posix.join(
    accountingPositionId,
    `${documentType.toLowerCase()}-${Date.now()}.pdf`,
  );
  const absolutePath = resolveOrderLegalDocumentPath(storageKey);

  await mkdir(path.dirname(absolutePath), { recursive: true });
  await writeFile(absolutePath, bytes);

  return { storageKey };
}

export async function readOrderLegalPdf(storageKey: string): Promise<Uint8Array> {
  return readFile(resolveOrderLegalDocumentPath(storageKey));
}
