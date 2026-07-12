/**
 * @file page-seo-service.ts
 * @purpose CRUD und Scan-Logik für site-weites SEO.
 */

import { Prisma, type PageSeo } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import { discoverPublicPages } from "./page-seo-discovery";
import { enqueuePageSeoJobs } from "./page-seo-queue-service";
import type {
  PageSeoAdminListItem,
  PageSeoRecord,
  PageSeoScanSummary,
  PageSeoSettingsData,
  UpdatePageSeoSettingsInput,
} from "./page-seo-types";
import { parseStringArray } from "./page-seo-types";

const SETTINGS_ID = "default";

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function mapSettings(row: {
  autoGenerateEnabled: boolean;
  autoUpdateOnChange: boolean;
  onlyPublishedPages: boolean;
  maxApiCallsPerDay: number;
  apiCallsToday: number;
  apiCallsResetAt: Date | null;
  updatedAt: Date;
}): PageSeoSettingsData {
  return {
    autoGenerateEnabled: row.autoGenerateEnabled,
    autoUpdateOnChange: row.autoUpdateOnChange,
    onlyPublishedPages: row.onlyPublishedPages,
    maxApiCallsPerDay: row.maxApiCallsPerDay,
    apiCallsToday: row.apiCallsToday,
    apiCallsResetAt: row.apiCallsResetAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function resolveStatusLabel(
  row: PageSeo,
  hasSeoData: boolean,
  currentHash: string | null,
): string {
  if (row.seoSource === "manual") {
    return "Manuell gepflegt";
  }

  if (!hasSeoData && row.generationStatus === "pending") {
    return "Ungeprüft";
  }

  if (currentHash && row.contentHash && currentHash !== row.contentHash) {
    return "Inhalt geändert";
  }

  if (row.generationStatus === "stale") {
    return "Veraltet";
  }

  if (row.generationStatus === "queued" || row.generationStatus === "processing") {
    return "In Warteschlange";
  }

  if (row.generationStatus === "failed") {
    return "Fehler";
  }

  if (row.generationStatus === "pending_review" || row.seoDraft) {
    return "Vorschlag wartet auf Freigabe";
  }

  return hasSeoData ? "Freigegeben" : "Ungeprüft";
}

export function mapPageSeoRecord(row: PageSeo, currentHash: string | null = null): PageSeoRecord {
  const keywords = parseStringArray(row.keywords);
  const hasSeoData = Boolean(row.metaTitle && row.metaDescription);

  return {
    id: row.id,
    routeKey: row.routeKey,
    path: row.path,
    pageType: row.pageType,
    entityId: row.entityId,
    seoSource: row.seoSource,
    metaTitle: row.metaTitle,
    metaDescription: row.metaDescription,
    keywords,
    ogTitle: row.ogTitle,
    ogDescription: row.ogDescription,
    ogImage: row.ogImage,
    twitterTitle: row.twitterTitle,
    twitterDescription: row.twitterDescription,
    canonicalUrl: row.canonicalUrl,
    jsonLd:
      row.jsonLd && typeof row.jsonLd === "object" && !Array.isArray(row.jsonLd)
        ? (row.jsonLd as Record<string, unknown>)
        : null,
    aiSummary: row.aiSummary,
    aiMainTopic: row.aiMainTopic,
    aiEntities: parseStringArray(row.aiEntities),
    aiAudience: row.aiAudience,
    aiExpertise: row.aiExpertise,
    semanticKeywords: parseStringArray(row.semanticKeywords),
    contentHash: row.contentHash,
    lastGeneratedAt: row.lastGeneratedAt?.toISOString() ?? null,
    lastContentChangeAt: row.lastContentChangeAt?.toISOString() ?? null,
    generationStatus: row.generationStatus,
    errorMessage: row.errorMessage,
    isPublished: row.isPublished,
    isContentStale: Boolean(currentHash && row.contentHash && currentHash !== row.contentHash),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toAdminListItem(row: PageSeo, currentHash: string | null = null): PageSeoAdminListItem {
  const mapped = mapPageSeoRecord(row, currentHash);
  const hasSeoData = Boolean(row.metaTitle && row.metaDescription);
  const draft =
    row.seoDraft && typeof row.seoDraft === "object" && !Array.isArray(row.seoDraft)
      ? (row.seoDraft as Record<string, unknown>)
      : null;

  return {
    ...mapped,
    hasSeoData,
    hasPendingDraft: Boolean(draft),
    draftMetaTitle: typeof draft?.metaTitle === "string" ? draft.metaTitle : null,
    statusLabel: resolveStatusLabel(row, hasSeoData, currentHash),
  };
}

async function ensurePageSeoSettings() {
  return prisma.pageSeoSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID },
    update: {},
  });
}

export async function getPageSeoSettings(): Promise<PageSeoSettingsData> {
  const row = await ensurePageSeoSettings();
  return mapSettings(row);
}

export async function updatePageSeoSettings(
  input: UpdatePageSeoSettingsInput,
): Promise<PageSeoSettingsData> {
  await ensurePageSeoSettings();

  const row = await prisma.pageSeoSettings.update({
    where: { id: SETTINGS_ID },
    data: {
      autoGenerateEnabled: input.autoGenerateEnabled,
      autoUpdateOnChange: input.autoUpdateOnChange,
      onlyPublishedPages: input.onlyPublishedPages,
      maxApiCallsPerDay: input.maxApiCallsPerDay,
    },
  });

  return mapSettings(row);
}

async function resetApiCallsIfNeeded() {
  const settings = await ensurePageSeoSettings();
  const today = startOfUtcDay(new Date());

  if (!settings.apiCallsResetAt || settings.apiCallsResetAt < today) {
    await prisma.pageSeoSettings.update({
      where: { id: SETTINGS_ID },
      data: {
        apiCallsToday: 0,
        apiCallsResetAt: today,
      },
    });
  }
}

export async function canConsumePageSeoApiCall(): Promise<boolean> {
  await resetApiCallsIfNeeded();
  const settings = await getPageSeoSettings();
  return settings.apiCallsToday < settings.maxApiCallsPerDay;
}

export async function recordPageSeoApiCall(): Promise<void> {
  await resetApiCallsIfNeeded();

  await prisma.pageSeoSettings.update({
    where: { id: SETTINGS_ID },
    data: {
      apiCallsToday: { increment: 1 },
      apiCallsResetAt: startOfUtcDay(new Date()),
    },
  });
}

export async function upsertDiscoveredPage(page: {
  routeKey: string;
  path: string;
  pageType: PageSeo["pageType"];
  entityId: string | null;
  isPublished: boolean;
  contentHash: string;
}) {
  const existing = await prisma.pageSeo.findUnique({
    where: { routeKey: page.routeKey },
  });

  if (!existing) {
    return prisma.pageSeo.create({
      data: {
        routeKey: page.routeKey,
        path: page.path,
        pageType: page.pageType,
        entityId: page.entityId,
        isPublished: page.isPublished,
        contentHash: page.contentHash,
        generationStatus: "pending",
      },
    });
  }

  const contentChanged =
    existing.contentHash !== null && existing.contentHash !== page.contentHash;

  return prisma.pageSeo.update({
    where: { id: existing.id },
    data: {
      path: page.path,
      pageType: page.pageType,
      entityId: page.entityId,
      isPublished: page.isPublished,
      contentHash: page.contentHash,
      lastContentChangeAt: contentChanged ? new Date() : existing.lastContentChangeAt,
      generationStatus:
        contentChanged && existing.seoSource === "auto" ? "stale" : existing.generationStatus,
    },
  });
}

export async function scanPublicPages(): Promise<PageSeoScanSummary> {
  const settings = await getPageSeoSettings();
  const discovered = await discoverPublicPages(settings.onlyPublishedPages);

  const summary: PageSeoScanSummary = {
    discovered: discovered.length,
    created: 0,
    stale: 0,
    queued: 0,
    unchanged: 0,
  };

  const toQueue: string[] = [];

  for (const page of discovered) {
    const existing = await prisma.pageSeo.findUnique({
      where: { routeKey: page.routeKey },
    });

    if (!existing) {
      await upsertDiscoveredPage(page);
      summary.created += 1;
      toQueue.push(page.routeKey);
      continue;
    }

    if (existing.contentHash !== page.contentHash) {
      await upsertDiscoveredPage(page);

      if (existing.seoSource === "auto") {
        summary.stale += 1;
        toQueue.push(page.routeKey);
      } else {
        summary.unchanged += 1;
      }
    } else if (!existing.metaTitle && existing.seoSource === "auto") {
      toQueue.push(page.routeKey);
    } else {
      summary.unchanged += 1;
    }
  }

  if (settings.autoGenerateEnabled && toQueue.length > 0) {
    summary.queued = await enqueuePageSeoJobs(toQueue, "generate");
  }

  return summary;
}

export async function queueMissingPageSeo(): Promise<number> {
  const rows = await prisma.pageSeo.findMany({
    where: {
      seoSource: "auto",
      OR: [{ metaTitle: null }, { metaDescription: null }],
      generationStatus: { in: ["pending", "stale", "failed"] },
    },
    select: { routeKey: true },
  });

  return enqueuePageSeoJobs(
    rows.map((row) => row.routeKey),
    "generate",
  );
}

export async function queueRegenerateAutoPageSeo(): Promise<number> {
  const rows = await prisma.pageSeo.findMany({
    where: { seoSource: "auto" },
    select: { routeKey: true },
  });

  return enqueuePageSeoJobs(
    rows.map((row) => row.routeKey),
    "regenerate",
  );
}

export async function listPageSeoAdminItems(): Promise<PageSeoAdminListItem[]> {
  const settings = await getPageSeoSettings();
  const discovered = await discoverPublicPages(settings.onlyPublishedPages);
  const hashByRoute = new Map(discovered.map((page) => [page.routeKey, page.contentHash]));

  const rows = await prisma.pageSeo.findMany({
    orderBy: [{ path: "asc" }],
  });

  return rows
    .map((row) => toAdminListItem(row, hashByRoute.get(row.routeKey) ?? null))
    .sort((a, b) => a.path.localeCompare(b.path, "de"));
}

export async function getPageSeoByRouteKey(routeKey: string): Promise<PageSeoRecord | null> {
  const row = await prisma.pageSeo.findUnique({ where: { routeKey } });

  if (!row) {
    return null;
  }

  const content = await discoverPublicPages(false);
  const hash = content.find((page) => page.routeKey === routeKey)?.contentHash ?? null;

  return mapPageSeoRecord(row, hash);
}

export async function markPageSeoManual(routeKey: string): Promise<PageSeoRecord | null> {
  const row = await prisma.pageSeo.update({
    where: { routeKey },
    data: {
      seoSource: "manual",
      generationStatus: "skipped",
    },
  });

  return mapPageSeoRecord(row);
}

type StoredPageSeoDraft = {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string | null;
  twitterTitle?: string;
  twitterDescription?: string;
  canonicalUrl?: string;
  jsonLd?: Record<string, unknown>;
  aiSummary?: string;
  aiMainTopic?: string;
  aiEntities?: string[];
  aiAudience?: string;
  aiExpertise?: string;
  semanticKeywords?: string[];
};

function parsePageSeoDraft(value: unknown): StoredPageSeoDraft | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  return value as StoredPageSeoDraft;
}

export async function approvePageSeoDraft(routeKey: string): Promise<PageSeoRecord | null> {
  const row = await prisma.pageSeo.findUnique({ where: { routeKey } });

  if (!row) {
    throw new Error("Seite nicht gefunden.");
  }

  const draft = parsePageSeoDraft(row.seoDraft);

  if (!draft) {
    throw new Error("Kein SEO-Vorschlag vorhanden.");
  }

  const updated = await prisma.pageSeo.update({
    where: { routeKey },
    data: {
      seoSource: "manual",
      metaTitle: draft.metaTitle ?? row.metaTitle,
      metaDescription: draft.metaDescription ?? row.metaDescription,
      keywords: draft.keywords ?? parseStringArray(row.keywords),
      ogTitle: draft.ogTitle ?? row.ogTitle,
      ogDescription: draft.ogDescription ?? row.ogDescription,
      ogImage: draft.ogImage ?? row.ogImage,
      twitterTitle: draft.twitterTitle ?? row.twitterTitle,
      twitterDescription: draft.twitterDescription ?? row.twitterDescription,
      canonicalUrl: draft.canonicalUrl ?? row.canonicalUrl,
      jsonLd: (draft.jsonLd ?? row.jsonLd ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
      aiSummary: draft.aiSummary ?? row.aiSummary,
      aiMainTopic: draft.aiMainTopic ?? row.aiMainTopic,
      aiEntities: draft.aiEntities ?? parseStringArray(row.aiEntities),
      aiAudience: draft.aiAudience ?? row.aiAudience,
      aiExpertise: draft.aiExpertise ?? row.aiExpertise,
      semanticKeywords: draft.semanticKeywords ?? parseStringArray(row.semanticKeywords),
      seoDraft: Prisma.DbNull,
      generationStatus: "completed",
      errorMessage: null,
    },
  });

  return mapPageSeoRecord(updated);
}

export async function rejectPageSeoDraft(routeKey: string): Promise<PageSeoRecord | null> {
  const row = await prisma.pageSeo.update({
    where: { routeKey },
    data: {
      seoDraft: Prisma.DbNull,
      generationStatus: "pending",
      errorMessage: null,
    },
  });

  return mapPageSeoRecord(row);
}
