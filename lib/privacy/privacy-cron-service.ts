/**
 * @file privacy-cron-service.ts
 */

import { unlink } from "node:fs/promises";
import path from "node:path";

import { prisma } from "@/lib/db/prisma";
import { retryFailedOrderLegalDocuments } from "@/lib/account/order-legal-document-service";

const EXPORT_ROOT = path.join(process.cwd(), "storage", "data-exports");

export async function expireDataExports(): Promise<number> {
  const expired = await prisma.dataExportRequest.findMany({
    where: {
      status: { in: ["READY", "DOWNLOADED"] },
      expiresAt: { lt: new Date() },
      storageKey: { not: null },
    },
    take: 50,
  });

  let count = 0;

  for (const row of expired) {
    if (row.storageKey) {
      const normalized = row.storageKey.replace(/\\/g, "/");

      if (!normalized.includes("..")) {
        try {
          await unlink(path.join(EXPORT_ROOT, normalized));
        } catch {
          // Datei bereits entfernt
        }
      }
    }

    await prisma.dataExportRequest.update({
      where: { id: row.id },
      data: { status: "EXPIRED", storageKey: null },
    });

    count += 1;
  }

  return count;
}

export async function processDueRetentionDeletions(): Promise<number> {
  const due = await prisma.accountDataRetention.findMany({
    where: {
      deletedAt: null,
      retentionUntil: { lte: new Date() },
    },
    take: 50,
  });

  let count = 0;

  for (const row of due) {
    await prisma.accountDataRetention.update({
      where: { id: row.id },
      data: { deletedAt: new Date() },
    });

    count += 1;
  }

  return count;
}

export async function runPrivacyMaintenanceJobs(): Promise<{
  expiredExports: number;
  retentionProcessed: number;
  legalDocsRetried: number;
}> {
  const [expiredExports, retentionProcessed, legalDocsRetried] = await Promise.all([
    expireDataExports(),
    processDueRetentionDeletions(),
    retryFailedOrderLegalDocuments(),
  ]);

  return { expiredExports, retentionProcessed, legalDocsRetried };
}
