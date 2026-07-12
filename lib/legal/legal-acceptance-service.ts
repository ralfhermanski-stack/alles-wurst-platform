/**
 * @file legal-acceptance-service.ts
 * @purpose Nutzer-Zustimmungen zu Rechtstexten (z. B. Forenregeln, vierteljährlich).
 */

import { prisma } from "@/lib/db/prisma";
import {
  FORUM_RULES_ACCEPTANCE_TYPE,
  FORUM_RULES_ACCEPTANCE_VALIDITY_DAYS,
  FORUM_RULES_CONSENT_TEXT,
} from "@/lib/legal/legal-consent-texts";
import {
  getPublishedLegalDocumentByType,
} from "@/lib/legal/legal-document-service";
import type { LegalDocumentPublicView } from "@/lib/legal/legal-types";
import { userFailure, userSuccess, type UserServiceResult } from "@/lib/users/user-errors";

export type ForumRulesAcceptanceStatus = {
  required: boolean;
  accepted: boolean;
  validUntil: string | null;
  acceptedAt: string | null;
  documentChecksum: string | null;
  documentVersionNumber: number | null;
  rulesUrl: string;
  labelText: string;
  reason: "MISSING" | "EXPIRED" | "DOCUMENT_UPDATED" | null;
};

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function mapDocument(document: LegalDocumentPublicView | null) {
  return {
    checksum: document?.checksum ?? null,
    versionNumber: document?.versionNumber ?? null,
    rulesUrl: document ? `/${document.slug}` : "/forenregeln",
  };
}

async function getPublishedForumRulesDocument(): Promise<LegalDocumentPublicView | null> {
  return getPublishedLegalDocumentByType("FORUM_RULES");
}

export async function getForumRulesAcceptanceStatus(
  userId: string,
): Promise<ForumRulesAcceptanceStatus> {
  const document = await getPublishedForumRulesDocument();
  const docMeta = mapDocument(document);

  const latest = await prisma.userLegalAcceptance.findFirst({
    where: {
      userId,
      acceptanceType: FORUM_RULES_ACCEPTANCE_TYPE,
    },
    orderBy: { acceptedAt: "desc" },
  });

  const now = new Date();
  let accepted = false;
  let reason: ForumRulesAcceptanceStatus["reason"] = null;

  if (!latest) {
    reason = "MISSING";
  } else if (latest.validUntil <= now) {
    reason = "EXPIRED";
  } else if (
    docMeta.checksum &&
    latest.documentChecksum !== docMeta.checksum
  ) {
    reason = "DOCUMENT_UPDATED";
  } else {
    accepted = true;
  }

  return {
    required: true,
    accepted,
    validUntil: latest?.validUntil.toISOString() ?? null,
    acceptedAt: latest?.acceptedAt.toISOString() ?? null,
    documentChecksum: docMeta.checksum,
    documentVersionNumber: docMeta.versionNumber,
    rulesUrl: docMeta.rulesUrl,
    labelText: FORUM_RULES_CONSENT_TEXT,
    reason,
  };
}

export async function recordForumRulesAcceptance(
  userId: string,
): Promise<UserServiceResult<ForumRulesAcceptanceStatus>> {
  const document = await getPublishedForumRulesDocument();

  if (!document?.checksum || !document.hasPublishedContent) {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Forenregeln sind derzeit nicht veröffentlicht.",
    });
  }

  const acceptedAt = new Date();
  const validUntil = addDays(acceptedAt, FORUM_RULES_ACCEPTANCE_VALIDITY_DAYS);

  const version = await prisma.legalDocumentVersion.findFirst({
    where: {
      document: { type: "FORUM_RULES" },
      checksum: document.checksum,
      status: "PUBLISHED",
    },
    orderBy: { versionNumber: "desc" },
    select: { id: true },
  });

  await prisma.userLegalAcceptance.create({
    data: {
      userId,
      acceptanceType: FORUM_RULES_ACCEPTANCE_TYPE,
      documentVersionId: version?.id ?? null,
      documentChecksum: document.checksum,
      labelText: FORUM_RULES_CONSENT_TEXT,
      acceptedAt,
      validUntil,
    },
  });

  return userSuccess(await getForumRulesAcceptanceStatus(userId));
}

export async function requireForumRulesAcceptance(
  userId: string,
): Promise<UserServiceResult<true>> {
  const status = await getForumRulesAcceptanceStatus(userId);

  if (status.accepted) {
    return userSuccess(true);
  }

  return userFailure({
    code: "FORUM_RULES_REQUIRED",
    message:
      "Bitte akzeptiere die Forenregeln, bevor du einen Beitrag verfasst.",
    details: {
      reason: status.reason ?? "MISSING",
      rulesUrl: status.rulesUrl,
    },
  });
}
