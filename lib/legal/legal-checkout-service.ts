/**
 * @file legal-checkout-service.ts
 */

import type { CheckoutConsentType, CourseAccessMode, ProductKind } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import {
  CHECKOUT_CONSENT_TEXTS_V1,
  CHECKOUT_CONSENT_VERSION,
} from "./legal-consent-texts";
import {
  getPublishedLegalDocumentByType,
} from "./legal-document-service";
import {
  defaultLegalProductType,
  resolveProductLegalConfig,
} from "./legal-types";

export type CheckoutLegalInput = {
  termsAccepted: boolean;
  privacyAcknowledged: boolean;
  immediateAccessConsent?: boolean;
  withdrawalLossAcknowledged?: boolean;
};

export type CheckoutLegalValidation = {
  requiresImmediateConsent: boolean;
  allowPurchaseWithoutImmediateConsent: boolean;
  accessMode: CourseAccessMode;
  pendingAccessUntil: Date | null;
  consentTexts: typeof CHECKOUT_CONSENT_TEXTS_V1;
};

export async function validateCheckoutLegalRequirements(input: {
  productKind: ProductKind;
  legalConfig: unknown;
  legalProductType?: string | null;
  consents: CheckoutLegalInput;
}): Promise<UserServiceResult<CheckoutLegalValidation>> {
  const config = resolveProductLegalConfig(input.productKind, input.legalConfig);
  const requiresImmediateConsent =
    config.requireImmediateAccessConsent && config.allowImmediateAccess;

  const [termsDoc, privacyDoc] = await Promise.all([
    getPublishedLegalDocumentByType("TERMS_AND_CONDITIONS"),
    getPublishedLegalDocumentByType("PRIVACY_POLICY"),
  ]);

  if (!termsDoc?.hasPublishedContent) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message:
        "Die AGB sind noch nicht veröffentlicht. Der Checkout ist vorübergehend nicht möglich.",
    });
  }

  if (!input.consents.termsAccepted) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Bitte akzeptiere die Allgemeinen Geschäftsbedingungen.",
    });
  }

  if (!input.consents.privacyAcknowledged) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Bitte bestätige die Kenntnisnahme der Datenschutzerklärung.",
    });
  }

  if (requiresImmediateConsent) {
    const bothGiven =
      input.consents.immediateAccessConsent === true &&
      input.consents.withdrawalLossAcknowledged === true;

    if (!bothGiven && !config.allowPurchaseWithoutImmediateConsent) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message:
          "Für die sofortige Bereitstellung digitaler Inhalte sind beide Erklärungen erforderlich.",
      });
    }
  }

  let accessMode: CourseAccessMode = "IMMEDIATE";
  let pendingAccessUntil: Date | null = null;

  if (requiresImmediateConsent) {
    const immediateAllowed =
      input.consents.immediateAccessConsent === true &&
      input.consents.withdrawalLossAcknowledged === true;

    if (immediateAllowed) {
      accessMode = "IMMEDIATE";
    } else {
      accessMode = "DELAYED";
      pendingAccessUntil = new Date();
      pendingAccessUntil.setDate(
        pendingAccessUntil.getDate() + config.withdrawalPeriodDays,
      );
    }
  }

  return userSuccess({
    requiresImmediateConsent,
    allowPurchaseWithoutImmediateConsent:
      config.allowPurchaseWithoutImmediateConsent,
    accessMode,
    pendingAccessUntil,
    consentTexts: CHECKOUT_CONSENT_TEXTS_V1,
  });
}

export async function storeCheckoutLegalConsents(input: {
  checkoutIntentId: string;
  consents: CheckoutLegalInput;
}): Promise<void> {
  const [termsDoc, privacyDoc, withdrawalDoc] = await Promise.all([
    getPublishedLegalDocumentByType("TERMS_AND_CONDITIONS"),
    getPublishedLegalDocumentByType("PRIVACY_POLICY"),
    getPublishedLegalDocumentByType("WITHDRAWAL_POLICY"),
  ]);

  const entries: Array<{
    consentType: CheckoutConsentType;
    accepted: boolean;
    labelText: string;
    documentChecksum?: string | null;
  }> = [
    {
      consentType: "TERMS",
      accepted: input.consents.termsAccepted,
      labelText: CHECKOUT_CONSENT_TEXTS_V1.termsPrefix,
      documentChecksum: termsDoc?.checksum ?? null,
    },
    {
      consentType: "PRIVACY_ACKNOWLEDGEMENT",
      accepted: input.consents.privacyAcknowledged,
      labelText: CHECKOUT_CONSENT_TEXTS_V1.privacyPrefix,
      documentChecksum: privacyDoc?.checksum ?? null,
    },
  ];

  if (input.consents.immediateAccessConsent !== undefined) {
    entries.push({
      consentType: "IMMEDIATE_ACCESS",
      accepted: input.consents.immediateAccessConsent === true,
      labelText: CHECKOUT_CONSENT_TEXTS_V1.immediateAccess,
      documentChecksum: withdrawalDoc?.checksum ?? null,
    });
  }

  if (input.consents.withdrawalLossAcknowledged !== undefined) {
    entries.push({
      consentType: "WITHDRAWAL_LOSS_ACKNOWLEDGEMENT",
      accepted: input.consents.withdrawalLossAcknowledged === true,
      labelText: CHECKOUT_CONSENT_TEXTS_V1.withdrawalLoss,
      documentChecksum: withdrawalDoc?.checksum ?? null,
    });
  }

  await prisma.checkoutLegalConsent.createMany({
    data: entries.map((entry) => ({
      checkoutIntentId: input.checkoutIntentId,
      consentType: entry.consentType,
      accepted: entry.accepted,
      labelText: entry.labelText,
      documentChecksum: entry.documentChecksum ?? null,
    })),
  });
}

export async function createPurchaseLegalRecord(input: {
  checkoutIntentId: string;
  userId: string;
  accountingPositionId: string | null;
  productKind: ProductKind;
  legalConfig: unknown;
  accessMode: CourseAccessMode;
  pendingAccessUntil: Date | null;
  immediateAccessConsented: boolean;
  withdrawalLossAcknowledged: boolean;
}): Promise<void> {
  const [termsDoc, privacyDoc, withdrawalDoc] = await Promise.all([
    getPublishedLegalDocumentByType("TERMS_AND_CONDITIONS"),
    getPublishedLegalDocumentByType("PRIVACY_POLICY"),
    getPublishedLegalDocumentByType("WITHDRAWAL_POLICY"),
  ]);

  const consents = await prisma.checkoutLegalConsent.findMany({
    where: { checkoutIntentId: input.checkoutIntentId },
  });

  await prisma.purchaseLegalRecord.create({
    data: {
      checkoutIntentId: input.checkoutIntentId,
      userId: input.userId,
      accountingPositionId: input.accountingPositionId,
      termsChecksum: termsDoc?.checksum ?? null,
      privacyChecksum: privacyDoc?.checksum ?? null,
      withdrawalPolicyChecksum: withdrawalDoc?.checksum ?? null,
      immediateAccessConsented: input.immediateAccessConsented,
      withdrawalLossAcknowledged: input.withdrawalLossAcknowledged,
      accessMode: input.accessMode,
      pendingAccessUntil: input.pendingAccessUntil,
      legalProductType: defaultLegalProductType(input.productKind),
      consentSnapshot: {
        version: CHECKOUT_CONSENT_VERSION,
        consents: consents.map((consent) => ({
          type: consent.consentType,
          accepted: consent.accepted,
          labelText: consent.labelText,
          documentChecksum: consent.documentChecksum,
          recordedAt: consent.createdAt.toISOString(),
        })),
      },
    },
  });
}

export async function resolveCourseAccessFromLegalRecord(input: {
  checkoutIntentId: string;
}): Promise<{ status: "pending" | "active"; pendingAccessUntil: Date | null }> {
  const record = await prisma.purchaseLegalRecord.findUnique({
    where: { checkoutIntentId: input.checkoutIntentId },
  });

  if (!record) {
    return { status: "active", pendingAccessUntil: null };
  }

  if (record.accessMode === "DELAYED") {
    return {
      status: "pending",
      pendingAccessUntil: record.pendingAccessUntil,
    };
  }

  return { status: "active", pendingAccessUntil: null };
}

export async function activateDueDelayedCourseAccess(): Promise<number> {
  const now = new Date();

  const pendingAccess = await prisma.courseAccess.findMany({
    where: {
      status: "pending",
      pendingAccessUntil: { lte: now },
    },
  });

  let activated = 0;

  for (const access of pendingAccess) {
    await prisma.courseAccess.update({
      where: { id: access.id },
      data: {
        status: "active",
        grantedAt: now,
        pendingAccessUntil: null,
      },
    });

    const { syncUserCourseAccessFromProduct } = await import(
      "@/lib/courses/course-access-service"
    );

    await syncUserCourseAccessFromProduct({
      userId: access.userId,
      productId: access.productId,
      courseAccessId: access.id,
      source: access.source,
      status: "active",
      grantedAt: now,
      expiresAt: access.expiresAt,
    });

    activated += 1;
  }

  return activated;
}
