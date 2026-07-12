/**
 * @file page-seo-types.ts
 * @purpose Typen für site-weites automatisches SEO.
 */

import type {
  PageSeoGenerationStatus,
  PageSeoPageType,
  PageSeoSource,
} from "@prisma/client";

export type { PageSeoGenerationStatus, PageSeoPageType, PageSeoSource };

export type PageSeoContentInput = {
  routeKey: string;
  path: string;
  pageType: PageSeoPageType;
  entityId: string | null;
  isPublished: boolean;
  title: string;
  heroText: string | null;
  description: string | null;
  headings: string[];
  bodyText: string;
  imageUrl: string | null;
  imageAlt: string | null;
  isLegalPage: boolean;
};

export type PageSeoGenerationResult = {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  ogTitle: string;
  ogDescription: string;
  ogImage: string | null;
  twitterTitle: string;
  twitterDescription: string;
  canonicalUrl: string;
  jsonLd: Record<string, unknown>;
  aiSummary: string;
  aiMainTopic: string;
  aiEntities: string[];
  aiAudience: string;
  aiExpertise: string;
  semanticKeywords: string[];
  source: "ai" | "fallback";
  warnings: string[];
};

export type PageSeoRecord = {
  id: string;
  routeKey: string;
  path: string;
  pageType: PageSeoPageType;
  entityId: string | null;
  seoSource: PageSeoSource;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string[];
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  canonicalUrl: string | null;
  jsonLd: Record<string, unknown> | null;
  aiSummary: string | null;
  aiMainTopic: string | null;
  aiEntities: string[];
  aiAudience: string | null;
  aiExpertise: string | null;
  semanticKeywords: string[];
  contentHash: string | null;
  lastGeneratedAt: string | null;
  lastContentChangeAt: string | null;
  generationStatus: PageSeoGenerationStatus;
  errorMessage: string | null;
  isPublished: boolean;
  isContentStale: boolean;
  updatedAt: string;
};

export type PageSeoSettingsData = {
  autoGenerateEnabled: boolean;
  autoUpdateOnChange: boolean;
  onlyPublishedPages: boolean;
  maxApiCallsPerDay: number;
  apiCallsToday: number;
  apiCallsResetAt: string | null;
  updatedAt: string;
};

export type UpdatePageSeoSettingsInput = Partial<{
  autoGenerateEnabled: boolean;
  autoUpdateOnChange: boolean;
  onlyPublishedPages: boolean;
  maxApiCallsPerDay: number;
}>;

export type PageSeoAdminListItem = PageSeoRecord & {
  hasSeoData: boolean;
  hasPendingDraft: boolean;
  draftMetaTitle: string | null;
  statusLabel: string;
};

export type PageSeoScanSummary = {
  discovered: number;
  created: number;
  stale: number;
  queued: number;
  unchanged: number;
};

export type PageSeoProcessSummary = {
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
  limitReached: boolean;
};

export function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}
