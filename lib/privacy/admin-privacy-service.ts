/**
 * @file admin-privacy-service.ts
 */

import { prisma } from "@/lib/db/prisma";

export async function listAdminPrivacyRequests() {
  return prisma.privacyRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true, publicName: true } },
        },
      },
      supportTicket: { select: { id: true, ticketNumber: true, status: true } },
      deletionPlan: true,
    },
  });
}

export async function getAdminPrivacyRequest(requestId: string) {
  return prisma.privacyRequest.findUnique({
    where: { id: requestId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true, publicName: true } },
        },
      },
      supportTicket: true,
      deletionPlan: true,
    },
  });
}

export async function listAdminDataExports() {
  return prisma.dataExportRequest.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, email: true } },
    },
  });
}

export async function updatePrivacyRequestStatus(input: {
  requestId: string;
  status: import("@prisma/client").PrivacyRequestStatus;
  responseText?: string | null;
  rejectionReason?: string | null;
  assignedToId?: string | null;
}) {
  return prisma.privacyRequest.update({
    where: { id: input.requestId },
    data: {
      status: input.status,
      responseText: input.responseText,
      rejectionReason: input.rejectionReason,
      assignedToId: input.assignedToId,
      completedAt:
        input.status === "FULFILLED" || input.status === "REJECTED"
          ? new Date()
          : undefined,
    },
  });
}
