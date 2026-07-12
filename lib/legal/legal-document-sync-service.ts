/**
 * @file legal-document-sync-service.ts
 */

import { prisma } from "@/lib/db/prisma";

import { importLegalDocumentVersion } from "./legal-document-service";
import { fetchExternalLegalContent } from "./legal-external-fetch";

export async function syncLegalDocument(
  documentId: string,
  triggeredBy = "manual",
  userId?: string | null,
): Promise<{ success: boolean; changed: boolean; logId: string }> {
  const document = await prisma.legalDocument.findUnique({
    where: { id: documentId },
    include: { currentPublishedVersion: true },
  });

  if (!document) {
    throw new Error("Rechtsdokument nicht gefunden.");
  }

  const log = await prisma.legalDocumentSyncLog.create({
    data: {
      documentId,
      status: "RUNNING",
      previousChecksum: document.currentPublishedVersion?.checksum ?? null,
      triggeredBy,
      triggeredByUserId: userId ?? null,
    },
  });

  if (!document.externalUrl?.trim()) {
    await prisma.legalDocumentSyncLog.update({
      where: { id: log.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorCode: "NO_EXTERNAL_URL",
        errorMessage: "Keine externe URL hinterlegt.",
      },
    });

    await prisma.legalDocument.update({
      where: { id: documentId },
      data: {
        lastCheckedAt: new Date(),
        lastErrorAt: new Date(),
        lastErrorMessage: "Keine externe URL hinterlegt.",
        status: document.status === "PUBLISHED" ? "OUTDATED" : document.status,
      },
    });

    return { success: false, changed: false, logId: log.id };
  }

  try {
    const fetched = await fetchExternalLegalContent(document.externalUrl);
    const format =
      document.contentFormat === "PLAIN_TEXT"
        ? "PLAIN_TEXT"
        : fetched.contentType?.includes("text/plain")
          ? "PLAIN_TEXT"
          : "HTML";

    const result = await importLegalDocumentVersion({
      documentId,
      content: fetched.content,
      contentFormat: format,
      importedById: userId ?? null,
      sourceMetadata: {
        url: document.externalUrl,
        contentType: fetched.contentType,
      },
      changeSummary: "Externe Synchronisierung",
      autoPublish: document.autoPublish,
    });

    await prisma.legalDocumentSyncLog.update({
      where: { id: log.id },
      data: {
        status: result.changed ? "SUCCESS" : "UNCHANGED",
        finishedAt: new Date(),
        contentChanged: result.changed,
        newChecksum: result.changed
          ? (
              await prisma.legalDocumentVersion.findUnique({
                where: { id: result.versionId ?? "" },
              })
            )?.checksum ?? null
          : document.currentPublishedVersion?.checksum ?? null,
      },
    });

    return { success: true, changed: result.changed, logId: log.id };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Synchronisierung fehlgeschlagen.";

    await prisma.legalDocumentSyncLog.update({
      where: { id: log.id },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        errorCode: "SYNC_FAILED",
        errorMessage: message.slice(0, 500),
      },
    });

    await prisma.legalDocument.update({
      where: { id: documentId },
      data: {
        lastCheckedAt: new Date(),
        lastErrorAt: new Date(),
        lastErrorMessage: message.slice(0, 500),
        status: document.status === "PUBLISHED" ? "OUTDATED" : "ERROR",
      },
    });

    return { success: false, changed: false, logId: log.id };
  }
}

export async function syncAllLegalDocuments(
  triggeredBy = "cron",
  userId?: string | null,
): Promise<number> {
  const documents = await prisma.legalDocument.findMany({
    where: {
      externalUrl: { not: null },
      integrationMode: { in: ["API_SYNC", "HTML_SYNC", "TEXT_SYNC", "WEBHOOK"] },
    },
  });

  let synced = 0;

  for (const document of documents) {
    const result = await syncLegalDocument(document.id, triggeredBy, userId);
    if (result.success) {
      synced += 1;
    }
  }

  return synced;
}
