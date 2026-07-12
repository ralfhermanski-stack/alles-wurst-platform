/**
 * @file admin-order-service.ts
 * @purpose Bestellungen/Buchhaltungspositionen für Administratoren.
 */

import { prisma } from "@/lib/db/prisma";
import { getPublicUserName } from "@/lib/users/public-user";

export type AdminOrderEntry = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  title: string;
  productType: string | null;
  grossAmount: string;
  paymentStatus: string;
  paymentProvider: string | null;
  providerReference: string | null;
  createdAt: string;
  paidAt: string | null;
};

export async function listAdminOrders(): Promise<AdminOrderEntry[]> {
  const positions = await prisma.accountingPosition.findMany({
    include: {
      user: { include: { profile: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return positions.map((position) => ({
    id: position.id,
    userId: position.userId,
    userName: getPublicUserName({ profile: position.user.profile }),
    userEmail: position.user.email,
    title: position.productName,
    productType: position.productType,
    grossAmount: position.grossAmount.toString(),
    paymentStatus: position.paymentStatus,
    paymentProvider: position.paymentProvider,
    providerReference: null,
    createdAt: position.createdAt.toISOString(),
    paidAt: position.paidAt?.toISOString() ?? null,
  }));
}
