/**
 * @file payment-intent-service.ts
 * @purpose Payment-Intent zu einem Checkout anlegen (Provider-Vorbereitung).
 */

import type { PaymentIntentStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import { syncAccountingPositionFromCheckout } from "./payment-sync-service";
import { paymentIntentStatusToAccountingStatus } from "./payment-status-mapper";
import type { CreatePaymentIntentInput, PaymentIntentEntry } from "./payment-types";
import { toPaymentIntentEntry } from "./payment-types";
import { getPaymentProviderAdapter } from "./payment-providers/provider-registry";

/**
 * Erstellt einen Payment-Intent und bereitet den gewählten Provider vor.
 */
export async function createPaymentIntentForCheckout(
  input: CreatePaymentIntentInput,
): Promise<UserServiceResult<PaymentIntentEntry>> {
  try {
    const checkout = await prisma.checkoutIntent.findUnique({
      where: { id: input.checkoutIntentId },
      include: {
        productPrice: {
          include: { product: true },
        },
      },
    });

    if (!checkout) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Checkout-Intent wurde nicht gefunden.",
      });
    }

    if (checkout.status === "succeeded" || checkout.status === "cancelled") {
      return userFailure({
        code: "CONFLICT",
        message: "Checkout ist bereits abgeschlossen.",
      });
    }

    const adapter = getPaymentProviderAdapter(checkout.paymentProvider);
    const prepared = await adapter.preparePayment({
      checkoutIntentId: checkout.id,
      userId: checkout.userId,
      grossAmount: checkout.grossAmount.toNumber(),
      currency: checkout.currency,
      productName: checkout.productPrice.product.name,
    });

    const providerMetadata = {
      ...prepared.providerMetadata,
      ...input.providerMetadata,
    };

    const payment = await prisma.$transaction(async (tx) => {
      const created = await tx.paymentIntent.create({
        data: {
          checkoutIntentId: checkout.id,
          paymentProvider: checkout.paymentProvider,
          status: prepared.status,
          providerReference:
            input.providerReference ?? prepared.providerReference ?? null,
          grossAmount: checkout.grossAmount,
          currency: checkout.currency,
          accountingPositionId: checkout.accountingPositionId,
          providerMetadata:
            Object.keys(providerMetadata).length > 0
              ? providerMetadata
              : undefined,
        },
      });

      await tx.checkoutIntent.update({
        where: { id: checkout.id },
        data: {
          status: prepared.status,
          providerMetadata:
            Object.keys(providerMetadata).length > 0
              ? providerMetadata
              : undefined,
        },
      });

      if (checkout.accountingPositionId) {
        const accountingStatus = paymentIntentStatusToAccountingStatus(
          prepared.status,
        );

        await tx.accountingPosition.update({
          where: { id: checkout.accountingPositionId },
          data: { paymentStatus: accountingStatus },
        });
      }

      return created;
    });

    await syncAccountingPositionFromCheckout(checkout.id);

    return userSuccess(toPaymentIntentEntry(payment));
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unbekannter Fehler";
    console.error(`[payments] Payment-Intent konnte nicht erstellt werden: ${detail}`);

    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Zahlungsvorgang konnte nicht vorbereitet werden.",
    });
  }
}

/**
 * Aktualisiert den Status eines Payment-Intents und synchronisiert die Buchhaltung.
 */
export async function updatePaymentIntentStatus(input: {
  paymentIntentId: string;
  status: PaymentIntentStatus;
  providerReference?: string | null;
}): Promise<UserServiceResult<PaymentIntentEntry>> {
  try {
    const payment = await prisma.paymentIntent.update({
      where: { id: input.paymentIntentId },
      data: {
        status: input.status,
        providerReference: input.providerReference ?? undefined,
        paidAt: input.status === "succeeded" ? new Date() : undefined,
        failedAt:
          input.status === "failed" || input.status === "cancelled"
            ? new Date()
            : undefined,
      },
    });

    if (payment.accountingPositionId) {
      await prisma.accountingPosition.update({
        where: { id: payment.accountingPositionId },
        data: {
          paymentStatus: paymentIntentStatusToAccountingStatus(input.status),
          paidAt: input.status === "succeeded" ? new Date() : null,
        },
      });
    }

    if (input.status === "succeeded") {
      await prisma.checkoutIntent.update({
        where: { id: payment.checkoutIntentId },
        data: {
          status: "succeeded",
          completedAt: new Date(),
        },
      });
    }

    return userSuccess(toPaymentIntentEntry(payment));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Zahlungsstatus konnte nicht aktualisiert werden.",
    });
  }
}
