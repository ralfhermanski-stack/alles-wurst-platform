/**
 * @file account-order-service.ts
 */

import type { CourseAccessMode, LegalProductType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import { createOrderAccessToken } from "./secure-order-token";

export type UserOrderSummary = {
  id: string;
  orderNumber: string;
  productName: string;
  productType: string;
  grossAmount: number;
  currency: string;
  paymentStatus: string;
  paidAt: string | null;
  createdAt: string;
  hasWithdrawal: boolean;
  accessStatus: string | null;
};

export type UserOrderDetail = UserOrderSummary & {
  checkoutIntentId: string | null;
  accessMode: CourseAccessMode | null;
  pendingAccessUntil: string | null;
  legalProductType: LegalProductType | null;
  immediateAccessConsented: boolean;
  withdrawalLossAcknowledged: boolean;
  withdrawalEligible: boolean;
  withdrawalExpiredNotice: boolean;
  openWithdrawalId: string | null;
  openWithdrawalNumber: string | null;
  withdrawalToken: string | null;
  legalDocuments: Array<{
    id: string;
    title: string;
    legalDocumentType: string;
    versionLabel: string | null;
    sizeBytes: number | null;
    status: string;
    generatedAt: string | null;
  }>;
};

export function formatOrderNumber(input: {
  invoiceNumber?: string | null;
  positionId: string;
}): string {
  if (input.invoiceNumber) {
    return input.invoiceNumber;
  }

  return `AW-B-${input.positionId.slice(0, 8).toUpperCase()}`;
}

function isWithdrawalEligible(paymentStatus: string): boolean {
  return paymentStatus === "paid";
}

export async function listUserOrders(
  userId: string,
): Promise<UserOrderSummary[]> {
  const positions = await prisma.accountingPosition.findMany({
    where: { userId },
    include: {
      invoice: { select: { invoiceNumber: true } },
      checkoutIntent: {
        include: {
          courseAccess: { take: 1 },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const withdrawals = await prisma.withdrawalRequest.findMany({
    where: {
      userId,
      accountingPositionId: { in: positions.map((position) => position.id) },
      status: {
        in: ["RECEIVED", "UNDER_REVIEW", "ADDITIONAL_INFORMATION_REQUIRED"],
      },
    },
    select: { accountingPositionId: true },
  });

  const withdrawalSet = new Set(
    withdrawals.map((entry) => entry.accountingPositionId).filter(Boolean),
  );

  return positions.map((position) => ({
    id: position.id,
    orderNumber: formatOrderNumber({
      invoiceNumber: position.invoice?.invoiceNumber,
      positionId: position.id,
    }),
    productName: position.productName,
    productType: position.productType,
    grossAmount: position.grossAmount.toNumber(),
    currency: position.currency,
    paymentStatus: position.paymentStatus,
    paidAt: position.paidAt?.toISOString() ?? null,
    createdAt: position.createdAt.toISOString(),
    hasWithdrawal: withdrawalSet.has(position.id),
    accessStatus: position.checkoutIntent?.courseAccess[0]?.status ?? null,
  }));
}

export async function getUserOrderDetail(
  userId: string,
  orderId: string,
): Promise<UserServiceResult<UserOrderDetail>> {
  const position = await prisma.accountingPosition.findFirst({
    where: { id: orderId, userId },
    include: {
      invoice: { select: { invoiceNumber: true } },
      checkoutIntent: {
        include: {
          purchaseLegalRecord: true,
          courseAccess: { take: 1 },
        },
      },
    },
  });

  if (!position) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Bestellung nicht gefunden.",
    });
  }

  const legalRecord = position.checkoutIntent?.purchaseLegalRecord ?? null;
  const courseAccess = position.checkoutIntent?.courseAccess[0] ?? null;

  const openWithdrawal = await prisma.withdrawalRequest.findFirst({
    where: {
      userId,
      accountingPositionId: position.id,
      status: {
        in: ["RECEIVED", "UNDER_REVIEW", "ADDITIONAL_INFORMATION_REQUIRED"],
      },
    },
    orderBy: { receivedAt: "desc" },
  });

  const legalDocuments = await prisma.orderLegalDocument.findMany({
    where: { accountingPositionId: position.id },
    orderBy: { legalDocumentType: "asc" },
  });

  const paid = isWithdrawalEligible(position.paymentStatus);
  const notRefunded = position.paymentStatus !== "refunded";
  const notCancelled = position.paymentStatus !== "cancelled";
  const noOpenWithdrawal = !openWithdrawal;

  const withdrawalEligible =
    paid && notRefunded && notCancelled && noOpenWithdrawal;

  const orderNumber = formatOrderNumber({
    invoiceNumber: position.invoice?.invoiceNumber,
    positionId: position.id,
  });

  const paidAt = position.paidAt ?? position.createdAt;
  const daysSincePurchase = Math.floor(
    (Date.now() - paidAt.getTime()) / (24 * 60 * 60 * 1000),
  );

  return userSuccess({
    id: position.id,
    orderNumber,
    productName: position.productName,
    productType: position.productType,
    grossAmount: position.grossAmount.toNumber(),
    currency: position.currency,
    paymentStatus: position.paymentStatus,
    paidAt: position.paidAt?.toISOString() ?? null,
    createdAt: position.createdAt.toISOString(),
    hasWithdrawal: Boolean(openWithdrawal),
    accessStatus: courseAccess?.status ?? null,
    checkoutIntentId: position.checkoutIntent?.id ?? null,
    accessMode: legalRecord?.accessMode ?? null,
    pendingAccessUntil: legalRecord?.pendingAccessUntil?.toISOString() ?? null,
    legalProductType: legalRecord?.legalProductType ?? null,
    immediateAccessConsented: legalRecord?.immediateAccessConsented ?? false,
    withdrawalLossAcknowledged: legalRecord?.withdrawalLossAcknowledged ?? false,
    withdrawalEligible,
    withdrawalExpiredNotice: daysSincePurchase > 14,
    openWithdrawalId: openWithdrawal?.id ?? null,
    openWithdrawalNumber: openWithdrawal?.withdrawalNumber ?? null,
    withdrawalToken: withdrawalEligible
      ? createOrderAccessToken(userId, position.id)
      : null,
    legalDocuments: legalDocuments.map((document) => ({
      id: document.id,
      title: document.title,
      legalDocumentType: document.legalDocumentType,
      versionLabel: document.versionLabel,
      sizeBytes: document.sizeBytes,
      status: document.status,
      generatedAt: document.generatedAt?.toISOString() ?? null,
    })),
  });
}

export async function assertUserOwnsOrder(
  userId: string,
  orderId: string,
): Promise<UserServiceResult<{ orderNumber: string; positionId: string }>> {
  const position = await prisma.accountingPosition.findFirst({
    where: { id: orderId, userId },
    include: { invoice: { select: { invoiceNumber: true } } },
  });

  if (!position) {
    return userFailure({
      code: "FORBIDDEN",
      message: "Diese Bestellung gehört nicht zu deinem Konto.",
    });
  }

  return userSuccess({
    orderNumber: formatOrderNumber({
      invoiceNumber: position.invoice?.invoiceNumber,
      positionId: position.id,
    }),
    positionId: position.id,
  });
}
