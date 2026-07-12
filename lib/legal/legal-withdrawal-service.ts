/**
 * @file legal-withdrawal-service.ts
 */

import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

export type CreateWithdrawalInput = {
  userId?: string | null;
  firstName: string;
  lastName: string;
  email: string;
  orderReference?: string | null;
  productName?: string | null;
  orderDate?: string | null;
  contractDate?: string | null;
  message?: string | null;
};

function generateWithdrawalNumber(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `WR-${stamp}-${random}`;
}

export async function createWithdrawalRequest(
  input: CreateWithdrawalInput,
): Promise<UserServiceResult<{ id: string; withdrawalNumber: string }>> {
  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const email = input.email.trim().toLowerCase();

  if (!firstName || !lastName || !email) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Vorname, Nachname und E-Mail sind erforderlich.",
    });
  }

  if (!email.includes("@")) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Bitte gib eine gültige E-Mail-Adresse an.",
    });
  }

  const withdrawalNumber = generateWithdrawalNumber();

  const request = await prisma.withdrawalRequest.create({
    data: {
      withdrawalNumber,
      userId: input.userId ?? null,
      firstName,
      lastName,
      email,
      orderReference: input.orderReference?.trim() || null,
      productName: input.productName?.trim() || null,
      orderDate: input.orderDate ? new Date(input.orderDate) : null,
      contractDate: input.contractDate ? new Date(input.contractDate) : null,
      message: input.message?.trim() || null,
      status: "RECEIVED",
    },
  });

  return userSuccess({
    id: request.id,
    withdrawalNumber: request.withdrawalNumber,
  });
}

export async function listAdminWithdrawalRequests() {
  return prisma.withdrawalRequest.findMany({
    orderBy: { receivedAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          profile: { select: { publicName: true, firstName: true } },
        },
      },
      assignedTo: {
        select: {
          id: true,
          email: true,
          profile: { select: { publicName: true, firstName: true } },
        },
      },
    },
  });
}

export async function updateWithdrawalStatus(input: {
  requestId: string;
  status: "UNDER_REVIEW" | "ACCEPTED" | "PARTIALLY_ACCEPTED" | "REJECTED" | "REFUNDED" | "CLOSED" | "ADDITIONAL_INFORMATION_REQUIRED";
  adminUserId: string;
  rejectionReason?: string | null;
  legalBasisReference?: string | null;
  internalNotes?: string | null;
  stripeRefundId?: string | null;
}): Promise<UserServiceResult<true>> {
  const existing = await prisma.withdrawalRequest.findUnique({
    where: { id: input.requestId },
  });

  if (!existing) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Widerrufsanfrage nicht gefunden.",
    });
  }

  await prisma.withdrawalRequest.update({
    where: { id: input.requestId },
    data: {
      status: input.status,
      assignedToId: input.adminUserId,
      rejectionReason: input.rejectionReason?.trim() || existing.rejectionReason,
      legalBasisReference:
        input.legalBasisReference?.trim() || existing.legalBasisReference,
      internalNotes: input.internalNotes?.trim() || existing.internalNotes,
      stripeRefundId: input.stripeRefundId?.trim() || existing.stripeRefundId,
      resolvedAt:
        input.status === "CLOSED" ||
        input.status === "REFUNDED" ||
        input.status === "REJECTED" ||
        input.status === "ACCEPTED" ||
        input.status === "PARTIALLY_ACCEPTED"
          ? new Date()
          : existing.resolvedAt,
    },
  });

  return userSuccess(true);
}
