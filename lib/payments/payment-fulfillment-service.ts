/**
 * @file payment-fulfillment-service.ts
 * @purpose Nach erfolgreicher Zahlung: Mitgliedschaft oder Kurszugriff vorbereiten.
 */

import type {
  AccountingProductType,
  BillingPeriod,
  MembershipRole,
  ProductKind,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  createPurchaseLegalRecord,
  resolveCourseAccessFromLegalRecord,
} from "@/lib/legal/legal-checkout-service";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import { PRODUCT_KIND_LABELS } from "./payment-labels";
import type { FulfillmentResult } from "./payment-types";

function productKindToAccountingType(kind: ProductKind): AccountingProductType {
  switch (kind) {
    case "membership_wurstclub":
    case "membership_meisterclub":
      return "membership";
    case "course":
      return "course";
    case "workshop":
      return "workshop";
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

function productKindToMembershipRole(kind: ProductKind): MembershipRole | null {
  switch (kind) {
    case "membership_wurstclub":
      return "wurstclub";
    case "membership_meisterclub":
      return "meisterclub";
    default:
      return null;
  }
}

function calculateAccessEnd(billingPeriod: BillingPeriod): Date | null {
  const now = new Date();

  switch (billingPeriod) {
    case "monthly": {
      const end = new Date(now);
      end.setMonth(end.getMonth() + 1);
      return end;
    }
    case "yearly": {
      const end = new Date(now);
      end.setFullYear(end.getFullYear() + 1);
      return end;
    }
    case "one_time":
      return null;
    default: {
      const exhaustive: never = billingPeriod;
      return exhaustive;
    }
  }
}

function calculateMembershipEnd(billingPeriod: BillingPeriod): Date {
  const accessEnd = calculateAccessEnd(billingPeriod);

  if (accessEnd) {
    return accessEnd;
  }

  const end = new Date();
  end.setFullYear(end.getFullYear() + 1);
  return end;
}

/**
 * Erfüllt eine erfolgreiche Zahlung: Mitgliedschaft upgraden oder Kurszugriff gewähren.
 */
export async function fulfillSuccessfulPayment(input: {
  userId: string;
  checkoutIntentId: string;
  accountingPositionId: string | null;
}): Promise<UserServiceResult<FulfillmentResult>> {
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

    const product = checkout.productPrice.product;
    const membershipRole = productKindToMembershipRole(product.kind);

    if (membershipRole) {
      const endsAt = calculateMembershipEnd(checkout.productPrice.billingPeriod);
      const now = new Date();

      await prisma.membership.upsert({
        where: { userId: input.userId },
        create: {
          userId: input.userId,
          role: membershipRole,
          status: "active",
          paymentStatus: "paid",
          accessBlocked: false,
          blockReason: null,
          startedAt: now,
          endsAt,
          extendedUntil: endsAt,
          billingPeriod: checkout.productPrice.billingPeriod,
          autoRenewEnabled:
            checkout.productPrice.billingPeriod === "monthly" ||
            checkout.productPrice.billingPeriod === "yearly",
          cancelAtPeriodEnd: false,
          cancelReason: null,
          cancelRequestedAt: null,
          renewalRemindersSuppressed: false,
          lastRenewalReminderForPeriodEnd: null,
          paymentNote: `${PRODUCT_KIND_LABELS[product.kind]} aktiviert.`,
        },
        update: {
          role: membershipRole,
          status: "active",
          paymentStatus: "paid",
          accessBlocked: false,
          blockReason: null,
          startedAt: now,
          endsAt,
          extendedUntil: endsAt,
          billingPeriod: checkout.productPrice.billingPeriod,
          autoRenewEnabled:
            checkout.productPrice.billingPeriod === "monthly" ||
            checkout.productPrice.billingPeriod === "yearly",
          cancelAtPeriodEnd: false,
          cancelReason: null,
          cancelRequestedAt: null,
          renewalRemindersSuppressed: false,
          lastRenewalReminderForPeriodEnd: null,
          paymentNote: `${PRODUCT_KIND_LABELS[product.kind]} aktiviert.`,
        },
      });

      const { grantMembershipBonusCourses } = await import(
        "@/lib/courses/course-access-service"
      );

      await grantMembershipBonusCourses({
        userId: input.userId,
        membershipRole,
        billingPeriod: checkout.productPrice.billingPeriod,
        membershipEndsAt: endsAt,
      });

      const { syncMembershipGroupForUser } = await import(
        "@/lib/permissions/permission-seed"
      );

      await syncMembershipGroupForUser(input.userId);

      return userSuccess({
        kind: "membership",
        membershipRole:
          membershipRole === "wurstclub" ? "wurstclub" : "meisterclub",
      });
    }

    if (product.kind === "course" || product.kind === "workshop") {
      const expiresAt = calculateAccessEnd(checkout.productPrice.billingPeriod);
      const now = new Date();

      const consents = await prisma.checkoutLegalConsent.findMany({
        where: { checkoutIntentId: checkout.id },
      });

      const immediateAccessConsented = consents.some(
        (consent) =>
          consent.consentType === "IMMEDIATE_ACCESS" && consent.accepted,
      );
      const withdrawalLossAcknowledged = consents.some(
        (consent) =>
          consent.consentType === "WITHDRAWAL_LOSS_ACKNOWLEDGEMENT" &&
          consent.accepted,
      );

      const metadata = checkout.providerMetadata as Record<string, unknown> | null;
      const accessMode =
        metadata?.accessMode === "DELAYED" ? "DELAYED" : "IMMEDIATE";
      const pendingAccessUntil =
        typeof metadata?.pendingAccessUntil === "string"
          ? new Date(metadata.pendingAccessUntil)
          : null;

      await createPurchaseLegalRecord({
        checkoutIntentId: checkout.id,
        userId: input.userId,
        accountingPositionId: input.accountingPositionId,
        productKind: product.kind,
        legalConfig: product.legalConfig,
        accessMode,
        pendingAccessUntil,
        immediateAccessConsented,
        withdrawalLossAcknowledged,
      });

      const { generateOrderLegalDocuments } = await import(
        "@/lib/account/order-legal-document-service"
      );

      if (input.accountingPositionId) {
        void generateOrderLegalDocuments({
          checkoutIntentId: checkout.id,
          userId: input.userId,
          accountingPositionId: input.accountingPositionId,
        }).catch((error) => {
          console.error("[orders] Vertrags-PDFs konnten nicht erzeugt werden.", error);
        });
      }

      const accessDecision = await resolveCourseAccessFromLegalRecord({
        checkoutIntentId: checkout.id,
      });

      const accessStatus = accessDecision.status;
      const grantedAt = accessStatus === "active" ? now : null;

      const access = await prisma.courseAccess.upsert({
        where: {
          userId_productId: {
            userId: input.userId,
            productId: product.id,
          },
        },
        create: {
          userId: input.userId,
          productId: product.id,
          status: accessStatus,
          source: "payment",
          checkoutIntentId: checkout.id,
          accountingPositionId: input.accountingPositionId,
          grantedAt,
          expiresAt,
          pendingAccessUntil: accessDecision.pendingAccessUntil,
        },
        update: {
          status: accessStatus,
          source: "payment",
          checkoutIntentId: checkout.id,
          accountingPositionId: input.accountingPositionId,
          grantedAt,
          expiresAt,
          pendingAccessUntil: accessDecision.pendingAccessUntil,
        },
      });

      const { syncUserCourseAccessFromProduct } = await import(
        "@/lib/courses/course-access-service"
      );

      await syncUserCourseAccessFromProduct({
        userId: input.userId,
        productId: product.id,
        courseAccessId: access.id,
        source: "payment",
        status: accessStatus,
        grantedAt: grantedAt ?? null,
        expiresAt,
      });

      return userSuccess({
        kind: "course_access",
        courseAccessId: access.id,
      });
    }

    return userSuccess({ kind: "none" });
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Zahlungs-Fulfillment konnte nicht abgeschlossen werden.",
    });
  }
}

/**
 * Hilfsfunktion: Produktart → Buchhaltungstyp für AccountingPosition.
 */
export function resolveAccountingProductType(
  kind: ProductKind,
): AccountingProductType {
  return productKindToAccountingType(kind);
}
