/**
 * @file legal-types.ts
 */

import type {
  LegalDocument,
  LegalDocumentType,
  LegalDocumentVersion,
  LegalProductType,
  ProductKind,
  WithdrawalRequestStatus,
} from "@prisma/client";

export type LegalDocumentPublicView = {
  type: LegalDocumentType;
  slug: string;
  title: string;
  contentHtml: string;
  versionNumber: number | null;
  checksum: string | null;
  providerName: string | null;
  externalUrl: string | null;
  embedUrl: string | null;
  integrationMode: string;
  publishedAt: string | null;
  updatedAt: string | null;
  seoIndex: boolean;
  isStale: boolean;
  hasPublishedContent: boolean;
};

export type LegalDocumentAdminEntry = {
  id: string;
  type: LegalDocumentType;
  title: string;
  slug: string;
  status: string;
  providerName: string | null;
  externalUrl: string | null;
  externalDocumentId: string | null;
  integrationMode: string;
  publicVisible: boolean;
  autoPublish: boolean;
  lastSuccessfulSyncAt: string | null;
  lastErrorMessage: string | null;
  currentVersionNumber: number | null;
  updatedAt: string;
};

export const LEGAL_DOCUMENT_SLUGS: Record<
  Exclude<LegalDocumentType, "OPTIONAL_OTHER">,
  string
> = {
  IMPRINT: "impressum",
  PRIVACY_POLICY: "datenschutz",
  TERMS_AND_CONDITIONS: "agb",
  WITHDRAWAL_POLICY: "widerrufsbelehrung",
  WITHDRAWAL_FORM: "widerrufsformular",
  COOKIE_POLICY: "cookie-einstellungen",
  FORUM_RULES: "forenregeln",
};

export const LEGAL_DOCUMENT_TYPE_LABELS: Record<LegalDocumentType, string> = {
  IMPRINT: "Impressum",
  PRIVACY_POLICY: "Datenschutzerklärung",
  TERMS_AND_CONDITIONS: "AGB",
  WITHDRAWAL_POLICY: "Widerrufsbelehrung",
  WITHDRAWAL_FORM: "Widerrufsformular",
  COOKIE_POLICY: "Cookie-Richtlinie",
  FORUM_RULES: "Forenregeln",
  OPTIONAL_OTHER: "Sonstiges",
};

export const WITHDRAWAL_STATUS_LABELS: Record<WithdrawalRequestStatus, string> = {
  RECEIVED: "Eingegangen",
  UNDER_REVIEW: "In Prüfung",
  ADDITIONAL_INFORMATION_REQUIRED: "Rückfrage",
  ACCEPTED: "Angenommen",
  PARTIALLY_ACCEPTED: "Teilweise angenommen",
  REJECTED: "Abgelehnt",
  REFUNDED: "Erstattet",
  CLOSED: "Abgeschlossen",
};

export const LEGAL_INTEGRATION_MODE_LABELS: Record<string, string> = {
  MANUAL: "Manuelle Pflege",
  HTML_SYNC: "HTML-Abruf (empfohlen)",
  TEXT_SYNC: "Text-Abruf",
  API_SYNC: "API-Abruf",
  WEBHOOK: "Webhook",
  IFRAME_PREVIEW_ONLY: "Iframe (live vom Anbieter)",
};

export type ProductLegalConfig = {
  allowImmediateAccess?: boolean;
  requireImmediateAccessConsent?: boolean;
  allowPurchaseWithoutImmediateConsent?: boolean;
  withdrawalPeriodDays?: number;
};

export function defaultLegalProductType(kind: ProductKind): LegalProductType {
  switch (kind) {
    case "course":
      return "DIGITAL_CONTENT";
    case "workshop":
      return "LIVE_SERVICE";
    case "membership_wurstclub":
    case "membership_meisterclub":
      return "MEMBERSHIP";
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}

export function parseProductLegalConfig(value: unknown): ProductLegalConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const raw = value as Record<string, unknown>;

  return {
    allowImmediateAccess:
      typeof raw.allowImmediateAccess === "boolean"
        ? raw.allowImmediateAccess
        : undefined,
    requireImmediateAccessConsent:
      typeof raw.requireImmediateAccessConsent === "boolean"
        ? raw.requireImmediateAccessConsent
        : undefined,
    allowPurchaseWithoutImmediateConsent:
      typeof raw.allowPurchaseWithoutImmediateConsent === "boolean"
        ? raw.allowPurchaseWithoutImmediateConsent
        : undefined,
    withdrawalPeriodDays:
      typeof raw.withdrawalPeriodDays === "number"
        ? raw.withdrawalPeriodDays
        : undefined,
  };
}

export function resolveProductLegalConfig(
  kind: ProductKind,
  config: unknown,
): Required<ProductLegalConfig> {
  const parsed = parseProductLegalConfig(config);
  const isDigitalContent = kind === "course" || kind === "workshop";

  return {
    allowImmediateAccess: parsed.allowImmediateAccess ?? isDigitalContent,
    requireImmediateAccessConsent:
      parsed.requireImmediateAccessConsent ?? isDigitalContent,
    allowPurchaseWithoutImmediateConsent:
      parsed.allowPurchaseWithoutImmediateConsent ?? true,
    withdrawalPeriodDays: parsed.withdrawalPeriodDays ?? 14,
  };
}

export type LegalDocumentWithVersion = LegalDocument & {
  currentPublishedVersion: LegalDocumentVersion | null;
};
