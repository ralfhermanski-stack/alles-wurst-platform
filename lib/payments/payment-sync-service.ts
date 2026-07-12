/**
 * @file payment-sync-service.ts
 * @purpose Synchronisation zwischen Checkout, Payment und AccountingPosition.
 */

import { prisma } from "@/lib/db/prisma";

import { checkoutIntentStatusToAccountingStatus } from "./payment-status-mapper";

/**
 * Synchronisiert eine Buchhaltungsposition anhand des Checkout-Status.
 */
export async function syncAccountingPositionFromCheckout(
  checkoutIntentId: string,
): Promise<void> {
  const checkout = await prisma.checkoutIntent.findUnique({
    where: { id: checkoutIntentId },
  });

  if (!checkout?.accountingPositionId) {
    return;
  }

  const accountingStatus = checkoutIntentStatusToAccountingStatus(checkout.status);

  if (!accountingStatus) {
    return;
  }

  await prisma.accountingPosition.update({
    where: { id: checkout.accountingPositionId },
    data: {
      paymentStatus: accountingStatus,
      paidAt: accountingStatus === "paid" ? new Date() : null,
    },
  });
}
