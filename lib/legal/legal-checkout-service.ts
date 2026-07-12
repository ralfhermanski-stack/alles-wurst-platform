/**
 * @file legal-checkout-service.ts
 */

import type {
  BillingPeriod,
  CheckoutConsentType,
  CourseAccessMode,
  ProductKind,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import { formatOrderNumber } from "@/lib/account/account-order-service";

import {
  CHECKOUT_CONSENT_TEXTS_V2,
  CHECKOUT_CONSENT_VERSION,
} from "./legal-consent-texts";
import { getPublishedLegalDocumentByType } from "./legal-document-service";
import type { PurchaseEvidence } from "./purchase-evidence";
import {
  defaultLegalProductType,
  resolveProductLegalConfig,
} from "./legal-types";

export type CheckoutLegalInput = {
  termsAccepted: boolean;
  privacyAcknowledged: boolean;
  immediateAccessConsent?: boolean | null;
  withdrawalLossAcknowledged?: boolean | null;
};

export type CheckoutLegalValidation = {
  requiresImmediateConsent: boolean;
  allowPurchaseWithoutImmediateConsent: boolean;
  accessMode: CourseAccessMode;
  pendingAccessUntil: Date | null;
  immediateAccessConsented: boolean;
  withdrawalLossAcknowledged: boolean;
  consentTexts: typeof CHECKOUT_CONSENT_TEXTS_V2;
};

function resolveMembershipRole(kind: ProductKind): string | null {
  switch (kind) {
    case "membership_wurstclub":
      return "wurstclub";
    case "membership_meisterclub":
      return "meisterclub";
    default:
      return null;
  }
}

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
    if (
      input.consents.immediateAccessConsent === undefined ||
      input.consents.immediateAccessConsent === null
    ) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message:
          "Bitte gib an, ob du die sofortige Bereitstellung digitaler Inhalte verlangst (Ja/Nein).",
      });
    }

    if (
      input.consents.withdrawalLossAcknowledged === undefined ||
      input.consents.withdrawalLossAcknowledged === null
    ) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message:
          "Bitte bestätige deine Kenntnis über einen möglichen Verlust des Widerrufsrechts (Ja/Nein).",
      });
    }

    const bothGiven =
      input.consents.immediateAccessConsent === true &&
      input.consents.withdrawalLossAcknowledged === true;

    if (!bothGiven && !config.allowPurchaseWithoutImmediateConsent) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message:
          "Für die sofortige Bereitstellung digitaler Inhalte sind beide Erklärungen mit „Ja“ erforderlich.",
      });
    }
  }

  const immediateAccessConsented =
    input.consents.immediateAccessConsent === true;
  const withdrawalLossAcknowledged =
    input.consents.withdrawalLossAcknowledged === true;

  let accessMode: CourseAccessMode = "IMMEDIATE";
  let pendingAccessUntil: Date | null = null;

  if (requiresImmediateConsent) {
    const immediateAllowed =
      immediateAccessConsented && withdrawalLossAcknowledged;

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
    immediateAccessConsented,
    withdrawalLossAcknowledged,
    consentTexts: CHECKOUT_CONSENT_TEXTS_V2,
  });
}

type PublishedDocRef = Awaited<
  ReturnType<typeof getPublishedLegalDocumentByType>
>;

async function resolveDocumentRefs(): Promise<{
  terms: PublishedDocRef;
  privacy: PublishedDocRef;
  withdrawal: PublishedDocRef;
}> {
  const [terms, privacy, withdrawal] = await Promise.all([
    getPublishedLegalDocumentByType("TERMS_AND_CONDITIONS"),
    getPublishedLegalDocumentByType("PRIVACY_POLICY"),
    getPublishedLegalDocumentByType("WITHDRAWAL_POLICY"),
  ]);

  return { terms, privacy, withdrawal };
}

export async function storeCheckoutLegalConsents(input: {
  checkoutIntentId: string;
  consents: CheckoutLegalInput;
}): Promise<void> {
  const { terms, privacy, withdrawal } = await resolveDocumentRefs();

  const entries: Array<{
    consentType: CheckoutConsentType;
    accepted: boolean;
    labelText: string;
    documentChecksum?: string | null;
    documentVersionId?: string | null;
  }> = [
    {
      consentType: "TERMS",
      accepted: input.consents.termsAccepted,
      labelText: CHECKOUT_CONSENT_TEXTS_V2.termsPrefix,
      documentChecksum: terms?.checksum ?? null,
      documentVersionId: terms?.versionId ?? null,
    },
    {
      consentType: "PRIVACY_ACKNOWLEDGEMENT",
      accepted: input.consents.privacyAcknowledged,
      labelText: CHECKOUT_CONSENT_TEXTS_V2.privacyPrefix,
      documentChecksum: privacy?.checksum ?? null,
      documentVersionId: privacy?.versionId ?? null,
    },
  ];

  if (
    input.consents.immediateAccessConsent !== undefined &&
    input.consents.immediateAccessConsent !== null
  ) {
    entries.push({
      consentType: "IMMEDIATE_ACCESS",
      accepted: input.consents.immediateAccessConsent === true,
      labelText: CHECKOUT_CONSENT_TEXTS_V2.immediateAccess,
      documentChecksum: withdrawal?.checksum ?? null,
      documentVersionId: withdrawal?.versionId ?? null,
    });
  }

  if (
    input.consents.withdrawalLossAcknowledged !== undefined &&
    input.consents.withdrawalLossAcknowledged !== null
  ) {
    entries.push({
      consentType: "WITHDRAWAL_LOSS_ACKNOWLEDGEMENT",
      accepted: input.consents.withdrawalLossAcknowledged === true,
      labelText: CHECKOUT_CONSENT_TEXTS_V2.withdrawalLoss,
      documentChecksum: withdrawal?.checksum ?? null,
      documentVersionId: withdrawal?.versionId ?? null,
    });
  }

  await prisma.checkoutLegalConsent.createMany({
    data: entries.map((entry) => ({
      checkoutIntentId: input.checkoutIntentId,
      consentType: entry.consentType,
      accepted: entry.accepted,
      labelText: entry.labelText,
      documentChecksum: entry.documentChecksum ?? null,
      documentVersionId: entry.documentVersionId ?? null,
    })),
  });
}

export async function createPurchaseLegalRecord(input: {
  checkoutIntentId: string;
  userId: string;
  accountingPositionId: string | null;
  productKind: ProductKind;
  productName: string;
  productSlug: string;
  billingPeriod: BillingPeriod;
  legalConfig: unknown;
  accessMode: CourseAccessMode;
  pendingAccessUntil: Date | null;
  immediateAccessConsented: boolean;
  withdrawalLossAcknowledged: boolean;
  evidence?: PurchaseEvidence;
}): Promise<void> {
  const { terms, privacy, withdrawal } = await resolveDocumentRefs();

  const consents = await prisma.checkoutLegalConsent.findMany({
    where: { checkoutIntentId: input.checkoutIntentId },
  });

  const orderNumber = input.accountingPositionId
    ? formatOrderNumber({ positionId: input.accountingPositionId })
    : null;

  await prisma.purchaseLegalRecord.create({
    data: {
      checkoutIntentId: input.checkoutIntentId,
      userId: input.userId,
      accountingPositionId: input.accountingPositionId,
      termsChecksum: terms?.checksum ?? null,
      privacyChecksum: privacy?.checksum ?? null,
      withdrawalPolicyChecksum: withdrawal?.checksum ?? null,
      termsVersionId: terms?.versionId ?? null,
      privacyVersionId: privacy?.versionId ?? null,
      withdrawalPolicyVersionId: withdrawal?.versionId ?? null,
      immediateAccessConsented: input.immediateAccessConsented,
      withdrawalLossAcknowledged: input.withdrawalLossAcknowledged,
      accessMode: input.accessMode,
      pendingAccessUntil: input.pendingAccessUntil,
      legalProductType: defaultLegalProductType(input.productKind),
      clientIpHash: input.evidence?.clientIpHash ?? null,
      userAgentHash: input.evidence?.userAgentHash ?? null,
      orderNumber,
      productName: input.productName,
      productSlug: input.productSlug,
      membershipRole: resolveMembershipRole(input.productKind),
      consentTextVersion: CHECKOUT_CONSENT_VERSION,
      recordedAt: input.evidence?.recordedAt ?? new Date(),
      consentSnapshot: {
        version: CHECKOUT_CONSENT_VERSION,
        productName: input.productName,
        productSlug: input.productSlug,
        billingPeriod: input.billingPeriod,
        orderNumber,
        clientIpHash: input.evidence?.clientIpHash ?? null,
        userAgentHash: input.evidence?.userAgentHash ?? null,
        documentVersions: {
          terms: {
            versionId: terms?.versionId ?? null,
            versionNumber: terms?.versionNumber ?? null,
            checksum: terms?.checksum ?? null,
          },
          privacy: {
            versionId: privacy?.versionId ?? null,
            versionNumber: privacy?.versionNumber ?? null,
            checksum: privacy?.checksum ?? null,
          },
          withdrawal: {
            versionId: withdrawal?.versionId ?? null,
            versionNumber: withdrawal?.versionNumber ?? null,
            checksum: withdrawal?.checksum ?? null,
          },
        },
        consents: consents.map((consent) => ({
          type: consent.consentType,
          accepted: consent.accepted,
          labelText: consent.labelText,
          documentChecksum: consent.documentChecksum,
          documentVersionId: consent.documentVersionId,
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

export async function activateDueDelayedAccess(): Promise<{
  courses: number;
  memberships: number;
}> {
  const now = new Date();

  const pendingAccess = await prisma.courseAccess.findMany({
    where: {
      status: "pending",
      pendingAccessUntil: { lte: now },
    },
  });

  let courses = 0;

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

    courses += 1;
  }

  const delayedRecords = await prisma.purchaseLegalRecord.findMany({
    where: {
      accessMode: "DELAYED",
      pendingAccessUntil: { lte: now },
      membershipRole: { not: null },
    },
    select: {
      userId: true,
      pendingAccessUntil: true,
      checkoutIntent: {
        select: {
          productPrice: {
            select: {
              billingPeriod: true,
              product: { select: { kind: true } },
            },
          },
        },
      },
    },
  });

  let memberships = 0;

  for (const record of delayedRecords) {
    const membership = await prisma.membership.findUnique({
      where: { userId: record.userId },
    });

    if (!membership?.accessBlocked) {
      continue;
    }

    await prisma.membership.update({
      where: { userId: record.userId },
      data: {
        accessBlocked: false,
        blockReason: null,
        paymentNote: "Mitgliedschaft freigeschaltet nach Widerrufsfrist.",
      },
    });

    const productKind = record.checkoutIntent.productPrice.product.kind;
    const membershipRole =
      productKind === "membership_meisterclub" ? "meisterclub" : "wurstclub";

    const { grantMembershipBonusCourses } = await import(
      "@/lib/courses/course-access-service"
    );

    await grantMembershipBonusCourses({
      userId: record.userId,
      membershipRole,
      billingPeriod: record.checkoutIntent.productPrice.billingPeriod,
      membershipEndsAt: membership.endsAt,
    });

    memberships += 1;
  }

  return { courses, memberships };
}

/** @deprecated Nutze activateDueDelayedAccess */
export async function activateDueDelayedCourseAccess(): Promise<number> {
  const result = await activateDueDelayedAccess();
  return result.courses;
}
