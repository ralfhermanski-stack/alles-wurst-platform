/**
 * @file checkout-intent-service.ts
 * @purpose Checkout-Intent anlegen und mit AccountingPosition verknüpfen.
 */

import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { findUserById } from "@/lib/users/user-service";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import {
  fulfillSuccessfulPayment,
  resolveAccountingProductType,
} from "./payment-fulfillment-service";
import { PRODUCT_KIND_LABELS, PAYMENT_PROVIDER_LABELS } from "./payment-labels";
import {
  isPaymentSucceeded,
} from "./payment-status-mapper";
import {
  createPurchaseLegalRecord,
  storeCheckoutLegalConsents,
  validateCheckoutLegalRequirements,
} from "@/lib/legal/legal-checkout-service";
import type {
  CheckoutIntentEntry,
  CreateCheckoutIntentInput,
  FulfillmentResult,
  LinkAccountingPositionInput,
} from "./payment-types";
import { toCheckoutIntentEntry } from "./payment-types";
import { getActiveProductPrice } from "./product-catalog-service";
import { createPaymentIntentForCheckout } from "./payment-intent-service";

const CHECKOUT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function parseDateInput(value: string | null | undefined): Date | null {
  if (!value?.trim()) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * Erstellt einen Checkout-Intent inkl. Buchhaltungsposition (pending).
 */
export async function createCheckoutIntent(
  input: CreateCheckoutIntentInput,
): Promise<UserServiceResult<CheckoutIntentEntry>> {
  const userResult = await findUserById(input.userId);

  if (!userResult.success) {
    return userResult;
  }

  if (!userResult.data) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Nutzer wurde nicht gefunden.",
    });
  }

  const priceResult = await getActiveProductPrice(input.productPriceId);

  if (!priceResult.success) {
    return priceResult;
  }

  if (!priceResult.data) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Produktpreis wurde nicht gefunden oder ist inaktiv.",
    });
  }

  const { price, product } = priceResult.data;
  const expiresAt = new Date(Date.now() + CHECKOUT_TTL_MS);
  const dueDate = parseDateInput(input.dueDate) ?? expiresAt;

  const legalConsents = input.legalConsents ?? {
    termsAccepted: false,
    privacyAcknowledged: false,
    immediateAccessConsent: null,
    withdrawalLossAcknowledged: null,
  };

  const legalValidation = await validateCheckoutLegalRequirements({
    productKind: product.kind,
    legalConfig: product.legalConfig,
    legalProductType: product.legalProductType,
    consents: legalConsents,
  });

  if (!legalValidation.success) {
    return legalValidation;
  }

  try {
    const checkout = await prisma.$transaction(async (tx) => {
      const position = await tx.accountingPosition.create({
        data: {
          userId: input.userId,
          productType: resolveAccountingProductType(product.kind),
          productName: product.name,
          grossAmount: new Prisma.Decimal(price.grossAmount),
          netAmount: new Prisma.Decimal(price.netAmount),
          taxRate: new Prisma.Decimal(price.taxRate),
          taxAmount: new Prisma.Decimal(price.taxAmount),
          currency: price.currency,
          paymentStatus: "pending",
          dueDate,
          productPriceId: price.id,
          paymentProvider: input.paymentProvider,
          note: input.note?.trim() || null,
        },
      });

      return tx.checkoutIntent.create({
        data: {
          userId: input.userId,
          productPriceId: price.id,
          paymentProvider: input.paymentProvider,
          status: "created",
          grossAmount: new Prisma.Decimal(price.grossAmount),
          netAmount: new Prisma.Decimal(price.netAmount),
          taxRate: new Prisma.Decimal(price.taxRate),
          taxAmount: new Prisma.Decimal(price.taxAmount),
          currency: price.currency,
          accountingPositionId: position.id,
          expiresAt,
          providerMetadata: {
            productSlug: product.slug,
            productKind: product.kind,
            productLabel: PRODUCT_KIND_LABELS[product.kind],
            providerLabel: PAYMENT_PROVIDER_LABELS[input.paymentProvider],
            accessMode: legalValidation.data.accessMode,
            pendingAccessUntil:
              legalValidation.data.pendingAccessUntil?.toISOString() ?? null,
          },
        },
      });
    });

    await storeCheckoutLegalConsents({
      checkoutIntentId: checkout.id,
      consents: legalConsents,
    });

    await createPurchaseLegalRecord({
      checkoutIntentId: checkout.id,
      userId: input.userId,
      accountingPositionId: checkout.accountingPositionId,
      productKind: product.kind,
      productName: product.name,
      productSlug: product.slug,
      billingPeriod: price.billingPeriod,
      legalConfig: product.legalConfig,
      accessMode: legalValidation.data.accessMode,
      pendingAccessUntil: legalValidation.data.pendingAccessUntil,
      immediateAccessConsented: legalValidation.data.immediateAccessConsented,
      withdrawalLossAcknowledged:
        legalValidation.data.withdrawalLossAcknowledged,
      evidence: input.evidence,
    });

    const paymentResult = await createPaymentIntentForCheckout({
      checkoutIntentId: checkout.id,
    });

    if (!paymentResult.success) {
      console.error(
        `[payments] Payment-Intent für Checkout ${checkout.id} konnte nicht erstellt werden.`,
      );
    }

    const refreshed = await prisma.checkoutIntent.findUnique({
      where: { id: checkout.id },
    });

    if (!refreshed) {
      return userFailure({
        code: "INTERNAL_ERROR",
        message: "Checkout-Intent konnte nicht geladen werden.",
      });
    }

    return userSuccess(toCheckoutIntentEntry(refreshed));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Checkout-Intent konnte nicht erstellt werden.",
    });
  }
}

/**
 * Verknüpft eine bestehende Buchhaltungsposition mit einem Checkout-Intent.
 */
export async function linkAccountingPositionToCheckout(
  input: LinkAccountingPositionInput,
): Promise<UserServiceResult<CheckoutIntentEntry>> {
  try {
    const checkout = await prisma.checkoutIntent.findUnique({
      where: { id: input.checkoutIntentId },
    });

    if (!checkout) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Checkout-Intent wurde nicht gefunden.",
      });
    }

    const position = await prisma.accountingPosition.findUnique({
      where: { id: input.accountingPositionId },
    });

    if (!position) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Buchhaltungsposition wurde nicht gefunden.",
      });
    }

    if (position.userId !== checkout.userId) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message: "Position und Checkout gehören nicht zum selben Nutzer.",
      });
    }

    if (
      checkout.accountingPositionId &&
      checkout.accountingPositionId !== position.id
    ) {
      return userFailure({
        code: "CONFLICT",
        message: "Checkout ist bereits mit einer anderen Position verknüpft.",
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.accountingPosition.update({
        where: { id: position.id },
        data: {
          productPriceId: checkout.productPriceId,
          paymentProvider: checkout.paymentProvider,
        },
      });

      return tx.checkoutIntent.update({
        where: { id: checkout.id },
        data: {
          accountingPositionId: position.id,
        },
      });
    });

    return userSuccess(toCheckoutIntentEntry(updated));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Verknüpfung konnte nicht gespeichert werden.",
    });
  }
}

/**
 * Markiert einen Checkout als erfolgreich und synchronisiert die Buchhaltungsposition.
 */
export async function completeCheckoutIntent(
  checkoutIntentId: string,
): Promise<UserServiceResult<CheckoutIntentEntry>> {
  try {
    const checkout = await prisma.checkoutIntent.update({
      where: { id: checkoutIntentId },
      data: {
        status: "succeeded",
        completedAt: new Date(),
      },
    });

    if (checkout.accountingPositionId) {
      await prisma.accountingPosition.update({
        where: { id: checkout.accountingPositionId },
        data: {
          paymentStatus: "paid",
          paidAt: new Date(),
        },
      });
    }

    await fulfillSuccessfulPayment({
      userId: checkout.userId,
      checkoutIntentId: checkout.id,
      accountingPositionId: checkout.accountingPositionId,
    });

    return userSuccess(toCheckoutIntentEntry(checkout));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Checkout konnte nicht abgeschlossen werden.",
    });
  }
}

/**
 * Synchronisiert eine Buchhaltungsposition anhand des Checkout-Status.
 * @deprecated Nutze payment-sync-service direkt
 */
export async function syncAccountingPositionFromCheckout(
  checkoutIntentId: string,
): Promise<void> {
  const { syncAccountingPositionFromCheckout: sync } = await import(
    "./payment-sync-service"
  );

  return sync(checkoutIntentId);
}

/**
 * Wird aufgerufen, wenn die Buchhaltung eine Position manuell als bezahlt markiert.
 */
export async function handleAccountingPositionPaid(
  positionId: string,
): Promise<UserServiceResult<FulfillmentResult | null>> {
  const checkout = await prisma.checkoutIntent.findFirst({
    where: { accountingPositionId: positionId },
  });

  if (!checkout) {
    return userSuccess(null);
  }

  if (checkout.status === "succeeded") {
    return userSuccess(null);
  }

  await prisma.checkoutIntent.update({
    where: { id: checkout.id },
    data: {
      status: "succeeded",
      completedAt: new Date(),
    },
  });

  const latestPayment = await prisma.paymentIntent.findFirst({
    where: { checkoutIntentId: checkout.id },
    orderBy: { createdAt: "desc" },
  });

  if (latestPayment && !isPaymentSucceeded(latestPayment.status)) {
    await prisma.paymentIntent.update({
      where: { id: latestPayment.id },
      data: {
        status: "succeeded",
        paidAt: new Date(),
      },
    });
  }

  return fulfillSuccessfulPayment({
    userId: checkout.userId,
    checkoutIntentId: checkout.id,
    accountingPositionId: positionId,
  });
}
