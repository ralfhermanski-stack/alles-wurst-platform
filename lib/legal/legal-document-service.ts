/**
 * @file legal-document-service.ts
 */

import type {
  LegalDocumentType,
  LegalDocumentVersionStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import { computeLegalChecksum } from "./legal-checksum";
import { normalizeLegalContent } from "./legal-html-sanitize";
import { resolveLegalProviderHttpsUrl } from "./legal-provider-hosts";
import {
  LEGAL_DOCUMENT_SLUGS,
  LEGAL_DOCUMENT_TYPE_LABELS,
  type LegalDocumentAdminEntry,
  type LegalDocumentPublicView,
} from "./legal-types";

const STALE_DAYS = 7;

function isDocumentStale(lastSync: Date | null): boolean {
  if (!lastSync) {
    return true;
  }

  const ageMs = Date.now() - lastSync.getTime();
  return ageMs > STALE_DAYS * 24 * 60 * 60 * 1000;
}

export function getUnavailableLegalMessage(title: string): string {
  return `<div class="rounded-lg border border-aw-gold/30 bg-aw-gold/5 p-6 text-sm text-aw-muted"><p><strong>${title}</strong> ist derzeit noch nicht veröffentlicht.</p><p class="mt-3">Bitte wende dich bei Fragen an <a href="mailto:kontakt@alles-wurst.de">kontakt@alles-wurst.de</a>.</p><p class="mt-3 text-xs">Hinweis: Rechtstexte werden durch einen Rechtsanwalt oder Rechtstexte-Anbieter bereitgestellt und im Adminbereich veröffentlicht.</p></div>`;
}

export async function ensureDefaultLegalDocuments(): Promise<void> {
  for (const [type, slug] of Object.entries(LEGAL_DOCUMENT_SLUGS) as Array<
    [Exclude<LegalDocumentType, "OPTIONAL_OTHER">, string]
  >) {
    const title = LEGAL_DOCUMENT_TYPE_LABELS[type];

    await prisma.legalDocument.upsert({
      where: { slug },
      create: {
        type,
        title,
        slug,
        status: "DRAFT",
        publicVisible: true,
        allowManualEditing: true,
        autoPublish: false,
      },
      update: {},
    });
  }
}

function isIframeEmbedMode(integrationMode: string): boolean {
  return integrationMode === "IFRAME_PREVIEW_ONLY";
}

function resolveDocumentEmbedUrl(
  integrationMode: string,
  externalUrl: string | null,
): string | null {
  if (!isIframeEmbedMode(integrationMode)) {
    return null;
  }

  return resolveLegalProviderHttpsUrl(externalUrl);
}

function mapPublishedLegalDocument(
  document: {
    type: LegalDocumentType;
    slug: string;
    title: string;
    providerName: string | null;
    externalUrl: string | null;
    integrationMode: string;
    updatedAt: Date;
    seoIndex: boolean;
    lastSuccessfulSyncAt: Date | null;
    status: string;
    currentPublishedVersion: {
      sanitizedContent: string;
      versionNumber: number;
      checksum: string;
      publishedAt: Date | null;
    } | null;
  },
): LegalDocumentPublicView {
  const embedUrl = resolveDocumentEmbedUrl(
    document.integrationMode,
    document.externalUrl,
  );
  const version = document.currentPublishedVersion;
  const iframePublished =
    embedUrl !== null && document.status === "PUBLISHED";

  if (iframePublished) {
    return {
      type: document.type,
      slug: document.slug,
      title: document.title,
      contentHtml: "",
      versionNumber: version?.versionNumber ?? null,
      checksum: version?.checksum ?? null,
      providerName: document.providerName,
      externalUrl: document.externalUrl,
      embedUrl,
      integrationMode: document.integrationMode,
      publishedAt: version?.publishedAt?.toISOString() ?? document.updatedAt.toISOString(),
      updatedAt: document.updatedAt.toISOString(),
      seoIndex: document.seoIndex,
      isStale: false,
      hasPublishedContent: true,
    };
  }

  if (!version || document.status !== "PUBLISHED") {
    return {
      type: document.type,
      slug: document.slug,
      title: document.title,
      contentHtml: getUnavailableLegalMessage(document.title),
      versionNumber: null,
      checksum: null,
      providerName: document.providerName,
      externalUrl: document.externalUrl,
      embedUrl: null,
      integrationMode: document.integrationMode,
      publishedAt: null,
      updatedAt: document.updatedAt.toISOString(),
      seoIndex: document.seoIndex,
      isStale: isDocumentStale(document.lastSuccessfulSyncAt),
      hasPublishedContent: false,
    };
  }

  return {
    type: document.type,
    slug: document.slug,
    title: document.title,
    contentHtml: version.sanitizedContent,
    versionNumber: version.versionNumber,
    checksum: version.checksum,
    providerName: document.providerName,
    externalUrl: document.externalUrl,
    embedUrl: null,
    integrationMode: document.integrationMode,
    publishedAt: version.publishedAt?.toISOString() ?? null,
    updatedAt: document.updatedAt.toISOString(),
    seoIndex: document.seoIndex,
    isStale: isDocumentStale(document.lastSuccessfulSyncAt),
    hasPublishedContent: true,
  };
}

export async function getPublishedLegalDocumentBySlug(
  slug: string,
): Promise<LegalDocumentPublicView | null> {
  const document = await prisma.legalDocument.findUnique({
    where: { slug },
    include: {
      currentPublishedVersion: true,
    },
  });

  if (!document || !document.publicVisible) {
    return null;
  }

  return mapPublishedLegalDocument(document);
}

export async function getPublishedLegalDocumentByType(
  type: LegalDocumentType,
): Promise<LegalDocumentPublicView | null> {
  const document = await prisma.legalDocument.findFirst({
    where: { type },
    orderBy: { updatedAt: "desc" },
  });

  if (!document) {
    return null;
  }

  return getPublishedLegalDocumentBySlug(document.slug);
}

export async function listAdminLegalDocuments(): Promise<LegalDocumentAdminEntry[]> {
  const documents = await prisma.legalDocument.findMany({
    orderBy: [{ type: "asc" }, { title: "asc" }],
    include: {
      currentPublishedVersion: true,
    },
  });

  return documents.map((document) => ({
    id: document.id,
    type: document.type,
    title: document.title,
    slug: document.slug,
    status: document.status,
    providerName: document.providerName,
    externalUrl: document.externalUrl,
    externalDocumentId: document.externalDocumentId,
    integrationMode: document.integrationMode,
    publicVisible: document.publicVisible,
    autoPublish: document.autoPublish,
    lastSuccessfulSyncAt:
      document.lastSuccessfulSyncAt?.toISOString() ?? null,
    lastErrorMessage: document.lastErrorMessage,
    currentVersionNumber: document.currentPublishedVersion?.versionNumber ?? null,
    updatedAt: document.updatedAt.toISOString(),
  }));
}

export async function importLegalDocumentVersion(input: {
  documentId: string;
  content: string;
  contentFormat: "HTML" | "MARKDOWN" | "PLAIN_TEXT";
  externalVersion?: string | null;
  importedById?: string | null;
  sourceMetadata?: Prisma.InputJsonValue;
  changeSummary?: string | null;
  autoPublish?: boolean;
}): Promise<{ changed: boolean; versionId: string | null }> {
  const document = await prisma.legalDocument.findUnique({
    where: { id: input.documentId },
    include: { currentPublishedVersion: true },
  });

  if (!document) {
    throw new Error("Rechtsdokument nicht gefunden.");
  }

  const sanitized = normalizeLegalContent(input.content, input.contentFormat);
  const checksum = computeLegalChecksum(sanitized);

  if (document.currentPublishedVersion?.checksum === checksum) {
    await prisma.legalDocument.update({
      where: { id: document.id },
      data: {
        lastCheckedAt: new Date(),
        lastSuccessfulSyncAt: new Date(),
        lastErrorAt: null,
        lastErrorMessage: null,
      },
    });

    return { changed: false, versionId: document.currentPublishedVersion.id };
  }

  const latest = await prisma.legalDocumentVersion.findFirst({
    where: { documentId: document.id },
    orderBy: { versionNumber: "desc" },
  });

  const versionNumber = (latest?.versionNumber ?? 0) + 1;
  const shouldAutoPublish = input.autoPublish ?? document.autoPublish;

  let versionStatus: LegalDocumentVersionStatus = "PENDING_REVIEW";

  if (shouldAutoPublish) {
    versionStatus = "PUBLISHED";
  }

  const version = await prisma.legalDocumentVersion.create({
    data: {
      documentId: document.id,
      versionNumber,
      externalVersion: input.externalVersion ?? null,
      content: input.content,
      sanitizedContent: sanitized,
      checksum,
      status: versionStatus,
      importedById: input.importedById ?? null,
      publishedAt: shouldAutoPublish ? new Date() : null,
      publishedById: shouldAutoPublish ? input.importedById ?? null : null,
      sourceMetadata: input.sourceMetadata ?? undefined,
      changeSummary: input.changeSummary ?? null,
    },
  });

  const documentUpdate: Prisma.LegalDocumentUpdateInput = {
    lastCheckedAt: new Date(),
    lastSuccessfulSyncAt: new Date(),
    lastErrorAt: null,
    lastErrorMessage: null,
    status: shouldAutoPublish ? "PUBLISHED" : "PENDING_REVIEW",
  };

  if (shouldAutoPublish) {
    documentUpdate.currentPublishedVersion = { connect: { id: version.id } };
  }

  await prisma.legalDocument.update({
    where: { id: document.id },
    data: documentUpdate,
  });

  if (shouldAutoPublish) {
    await prisma.legalDocumentVersion.updateMany({
      where: {
        documentId: document.id,
        id: { not: version.id },
        status: "PUBLISHED",
      },
      data: { status: "ARCHIVED" },
    });
  }

  return { changed: true, versionId: version.id };
}

export async function publishLegalDocumentVersion(
  documentId: string,
  versionId: string,
  adminUserId: string,
): Promise<void> {
  const version = await prisma.legalDocumentVersion.findFirst({
    where: { id: versionId, documentId },
  });

  if (!version) {
    throw new Error("Version nicht gefunden.");
  }

  await prisma.$transaction([
    prisma.legalDocumentVersion.update({
      where: { id: versionId },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        publishedById: adminUserId,
      },
    }),
    prisma.legalDocumentVersion.updateMany({
      where: {
        documentId,
        id: { not: versionId },
        status: "PUBLISHED",
      },
      data: { status: "ARCHIVED" },
    }),
    prisma.legalDocument.update({
      where: { id: documentId },
      data: {
        status: "PUBLISHED",
        currentPublishedVersionId: versionId,
      },
    }),
  ]);
}

export async function listLegalOverviewDocuments(): Promise<
  Array<{ type: LegalDocumentType; title: string; slug: string; published: boolean }>
> {
  await ensureDefaultLegalDocuments();

  const documents = await prisma.legalDocument.findMany({
    where: { publicVisible: true },
    orderBy: { type: "asc" },
  });

  return documents.map((document) => ({
    type: document.type,
    title: document.title,
    slug: document.slug,
    published: document.status === "PUBLISHED",
  }));
}

export type UpdateLegalDocumentInput = {
  providerName?: string | null;
  externalUrl?: string | null;
  externalDocumentId?: string | null;
  integrationMode?: "API_SYNC" | "HTML_SYNC" | "TEXT_SYNC" | "WEBHOOK" | "MANUAL" | "IFRAME_PREVIEW_ONLY";
  autoPublish?: boolean;
  publicVisible?: boolean;
};

function normalizeExternalUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error("Die externe URL ist ungültig.");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Nur HTTP(S)-URLs sind erlaubt.");
  }

  return parsed.toString();
}

export async function updateLegalDocumentSettings(
  documentId: string,
  input: UpdateLegalDocumentInput,
): Promise<LegalDocumentAdminEntry> {
  const existing = await prisma.legalDocument.findUnique({
    where: { id: documentId },
    include: { currentPublishedVersion: true },
  });

  if (!existing) {
    throw new Error("Rechtsdokument nicht gefunden.");
  }

  const nextIntegrationMode = input.integrationMode ?? existing.integrationMode;
  const nextExternalUrl =
    input.externalUrl !== undefined
      ? normalizeExternalUrl(input.externalUrl)
      : existing.externalUrl;
  const nextPublicVisible =
    input.publicVisible !== undefined ? input.publicVisible : existing.publicVisible;

  const shouldPublishIframeEmbed =
    nextIntegrationMode === "IFRAME_PREVIEW_ONLY" &&
    resolveLegalProviderHttpsUrl(nextExternalUrl) !== null &&
    nextPublicVisible;

  const updated = await prisma.legalDocument.update({
    where: { id: documentId },
    data: {
      providerName:
        input.providerName !== undefined
          ? input.providerName?.trim() || null
          : undefined,
      externalUrl:
        input.externalUrl !== undefined
          ? normalizeExternalUrl(input.externalUrl)
          : undefined,
      externalDocumentId:
        input.externalDocumentId !== undefined
          ? input.externalDocumentId?.trim() || null
          : undefined,
      integrationMode: input.integrationMode,
      autoPublish: input.autoPublish,
      publicVisible: input.publicVisible,
      status: shouldPublishIframeEmbed ? "PUBLISHED" : undefined,
    },
    include: { currentPublishedVersion: true },
  });

  return {
    id: updated.id,
    type: updated.type,
    title: updated.title,
    slug: updated.slug,
    status: updated.status,
    providerName: updated.providerName,
    externalUrl: updated.externalUrl,
    externalDocumentId: updated.externalDocumentId,
    integrationMode: updated.integrationMode,
    publicVisible: updated.publicVisible,
    autoPublish: updated.autoPublish,
    lastSuccessfulSyncAt:
      updated.lastSuccessfulSyncAt?.toISOString() ?? null,
    lastErrorMessage: updated.lastErrorMessage,
    currentVersionNumber: updated.currentPublishedVersion?.versionNumber ?? null,
    updatedAt: updated.updatedAt.toISOString(),
  };
}
