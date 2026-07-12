/**
 * @file legal-admin-service.ts
 */

import { prisma } from "@/lib/db/prisma";

export async function getLegalAdminOverview() {
  const [
    documents,
    pendingVersions,
    syncErrors,
    openWithdrawals,
    recentLogs,
  ] = await Promise.all([
    prisma.legalDocument.findMany({
      orderBy: { type: "asc" },
      include: { currentPublishedVersion: true },
    }),
    prisma.legalDocumentVersion.count({
      where: { status: "PENDING_REVIEW" },
    }),
    prisma.legalDocument.count({
      where: { status: { in: ["ERROR", "OUTDATED"] } },
    }),
    prisma.withdrawalRequest.count({
      where: {
        status: {
          in: ["RECEIVED", "UNDER_REVIEW", "ADDITIONAL_INFORMATION_REQUIRED"],
        },
      },
    }),
    prisma.legalDocumentSyncLog.findMany({
      orderBy: { startedAt: "desc" },
      take: 20,
      include: {
        document: { select: { title: true, slug: true } },
      },
    }),
  ]);

  const publishedCount = documents.filter(
    (document) => document.status === "PUBLISHED",
  ).length;

  return {
    documents,
    stats: {
      totalDocuments: documents.length,
      publishedCount,
      pendingVersions,
      syncErrors,
      openWithdrawals,
    },
    recentLogs,
  };
}

export async function listLegalSyncLogs(limit = 50) {
  return prisma.legalDocumentSyncLog.findMany({
    orderBy: { startedAt: "desc" },
    take: limit,
    include: {
      document: { select: { title: true, slug: true } },
    },
  });
}

export async function listLegalDocumentVersions(documentId?: string) {
  return prisma.legalDocumentVersion.findMany({
    where: documentId ? { documentId } : undefined,
    orderBy: [{ documentId: "asc" }, { versionNumber: "desc" }],
    include: {
      document: { select: { title: true, slug: true, type: true } },
    },
  });
}
