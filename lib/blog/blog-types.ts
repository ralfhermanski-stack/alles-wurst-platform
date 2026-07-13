/**
 * @file blog-types.ts
 * @purpose Typen für das Blog-/Magazin-System.
 */

import type { BlogPostStatus, BlogSearchIntent } from "@prisma/client";

export type BlogFaqItem = {
  question: string;
  answer: string;
};

export type BlogDefinitionBox = {
  term: string;
  definition: string;
};

export type BlogInternalLink = {
  label: string;
  url: string;
};

export type BlogCtaConfig = {
  showCourse?: boolean;
  showRecipe?: boolean;
  showWorkshop?: boolean;
  showMembership?: boolean;
  showNewsletter?: boolean;
  courseId?: string | null;
  recipeId?: string | null;
  workshopUrl?: string | null;
  customHeadline?: string | null;
};

export type BlogCategoryEntry = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  postCount?: number;
};

export type BlogTagEntry = {
  id: string;
  name: string;
  slug: string;
  postCount?: number;
};

export type BlogTopicEntry = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
};

export type BlogPostSummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  summary: string | null;
  status: BlogPostStatus;
  categoryName: string | null;
  categorySlug: string | null;
  authorDisplayName: string;
  coverUrl: string | null;
  coverAltText: string | null;
  readingTimeMinutes: number;
  publishedAt: string | null;
  contentUpdatedAt: string | null;
  updatedAt: string;
  viewCount: number;
  focusKeyword: string | null;
  primaryTopicName: string | null;
  primaryTopicSlug: string | null;
  tagNames: string[];
  isStale?: boolean;
};

export type BlogPostDetail = BlogPostSummary & {
  body: string;
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  focusKeyword: string | null;
  secondaryKeywords: string[];
  longtailKeywords: string[];
  keywordNotes: string | null;
  searchIntent: BlogSearchIntent | null;
  questionsToAnswer: string[];
  internalLinkNotes: string | null;
  faqItems: BlogFaqItem[];
  definitionBoxes: BlogDefinitionBox[];
  internalLinks: BlogInternalLink[];
  relatedPostIds: string[];
  linkedCourseIds: string[];
  linkedRecipeIds: string[];
  ctaConfig: BlogCtaConfig;
  reviewedByName: string | null;
  expertNote: string | null;
  sourcesNote: string | null;
  disclaimerNote: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  scheduledAt: string | null;
  lastReviewedAt: string | null;
  createdAt: string;
  authorUserId: string;
  categoryId: string | null;
  tagIds: string[];
  topicIds: string[];
  primaryTopicId: string | null;
  relatedPosts: BlogPostSummary[];
  linkedCourses: { id: string; title: string; slug: string }[];
  ogTitle: string | null;
  ogDescription: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  seoKeywords: string[];
  seoTagsSuggested: string[];
  schemaJson: Record<string, unknown> | null;
  internalLinkSuggestions: BlogSeoInternalLinkSuggestion[];
  seoScore: number | null;
  readabilityScore: number | null;
  lastSeoAnalysisAt: string | null;
};

export type BlogAdminPostDetail = BlogPostDetail & {
  qualityReport?: BlogQualityReport;
  seoAnalysisDraft?: BlogSeoAnalysisResult | null;
};

export type BlogSeoAnalysisInput = {
  postId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  summary: string | null;
  body: string;
  coverAltText: string | null;
  coverUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
  authorDisplayName: string;
  authorUserId: string;
  publishedAt: string | null;
  contentUpdatedAt: string | null;
  updatedAt: string | null;
  readingTimeMinutes: number;
  tagNames: string[];
  headings: string[];
  plainText: string;
};

export type BlogSeoInternalLinkSuggestion = {
  label: string;
  url: string;
  reason?: string;
};

export type BlogSeoAnalysisResult = {
  seoTitle: string;
  metaDescription: string;
  focusKeyword: string;
  seoKeywords: string[];
  suggestedTags: string[];
  suggestedCategoryNames: string[];
  aiSummary: string;
  faqItems: BlogFaqItem[];
  imageAltText: string;
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  internalLinkSuggestions: BlogSeoInternalLinkSuggestion[];
  schemaJson: Record<string, unknown>;
  seoScore: number;
  readabilityScore: number;
  readabilityLevel?: "beginner" | "intermediate" | "advanced";
  source: "ai" | "fallback";
  warnings: string[];
  analyzedAt: string;
};

export type BlogQualityIssue = {
  code: string;
  severity: "error" | "warning" | "info";
  message: string;
};

export type BlogQualityReport = {
  canPublish: boolean;
  issues: BlogQualityIssue[];
  seoScore: number;
  readabilityLevel: "beginner" | "intermediate" | "advanced";
};

export type BlogAdminListFilters = {
  status?: BlogPostStatus | "all";
  categoryId?: string;
  topicId?: string;
  tagId?: string;
  authorUserId?: string;
  query?: string;
  staleOnly?: boolean;
};

export type BlogPublicListFilters = {
  categorySlug?: string;
  tagSlug?: string;
  topicSlug?: string;
  query?: string;
  sort?: "newest" | "popular";
  limit?: number;
  offset?: number;
};

export type CreateBlogPostInput = {
  title: string;
  slug?: string;
  excerpt?: string | null;
  summary?: string | null;
  body?: string;
  categoryId?: string | null;
  focusKeyword?: string | null;
  tagIds?: string[];
  topicIds?: string[];
  primaryTopicId?: string | null;
};

export type UpdateBlogPostInput = Partial<{
  title: string;
  slug: string;
  excerpt: string | null;
  summary: string | null;
  body: string;
  status: BlogPostStatus;
  categoryId: string | null;
  focusKeyword: string | null;
  secondaryKeywords: string[];
  longtailKeywords: string[];
  keywordNotes: string | null;
  searchIntent: BlogSearchIntent | null;
  questionsToAnswer: string[];
  internalLinkNotes: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  twitterTitle: string | null;
  twitterDescription: string | null;
  coverAltText: string | null;
  faqItems: BlogFaqItem[];
  definitionBoxes: BlogDefinitionBox[];
  internalLinks: BlogInternalLink[];
  relatedPostIds: string[];
  linkedCourseIds: string[];
  linkedRecipeIds: string[];
  ctaConfig: BlogCtaConfig;
  reviewedByName: string | null;
  expertNote: string | null;
  sourcesNote: string | null;
  disclaimerNote: string | null;
  robotsIndex: boolean;
  robotsFollow: boolean;
  scheduledAt: string | null;
  lastReviewedAt: string | null;
  seoScore: number | null;
  readabilityScore: number | null;
  lastSeoAnalysisAt: string | null;
  schemaJson: Record<string, unknown> | null;
  seoKeywords: string[];
  seoTagsSuggested: string[];
  internalLinkSuggestions: BlogSeoInternalLinkSuggestion[];
  tagIds: string[];
  topicIds: string[];
  primaryTopicId: string | null;
}>;

export function parseStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function filterValidUuidStrings(values: string[]): string[] {
  return values
    .map((value) => value.trim())
    .filter((value) => UUID_RE.test(value));
}

export function parseUuidArray(value: unknown): string[] {
  return filterValidUuidStrings(parseStringArray(value));
}

export function parseFaqItems(value: unknown): BlogFaqItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is BlogFaqItem =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as BlogFaqItem).question === "string" &&
        typeof (item as BlogFaqItem).answer === "string",
    )
    .map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
    }))
    .filter((item) => item.question && item.answer);
}

export function parseDefinitionBoxes(value: unknown): BlogDefinitionBox[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is BlogDefinitionBox =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as BlogDefinitionBox).term === "string" &&
        typeof (item as BlogDefinitionBox).definition === "string",
    )
    .map((item) => ({
      term: item.term.trim(),
      definition: item.definition.trim(),
    }))
    .filter((item) => item.term && item.definition);
}

export function parseInternalLinks(value: unknown): BlogInternalLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is BlogInternalLink =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as BlogInternalLink).label === "string" &&
        typeof (item as BlogInternalLink).url === "string",
    )
    .map((item) => ({
      label: item.label.trim(),
      url: item.url.trim(),
    }))
    .filter((item) => item.label && item.url);
}

export function parseInternalLinkSuggestions(
  value: unknown,
): BlogSeoInternalLinkSuggestion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is BlogSeoInternalLinkSuggestion =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as BlogSeoInternalLinkSuggestion).label === "string" &&
        typeof (item as BlogSeoInternalLinkSuggestion).url === "string",
    )
    .map((item) => ({
      label: item.label.trim(),
      url: item.url.trim(),
      reason: typeof item.reason === "string" ? item.reason.trim() : undefined,
    }))
    .filter((item) => item.label && item.url);
}

export function parseSchemaJson(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
}

export function parseStoredSeoDraft(value: unknown): BlogSeoAnalysisResult | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const draft = value as BlogSeoAnalysisResult;

  if (typeof draft.seoTitle !== "string") {
    return null;
  }

  return {
    ...draft,
    faqItems: parseFaqItems(draft.faqItems),
    seoKeywords: parseStringArray(draft.seoKeywords),
    suggestedTags: parseStringArray(draft.suggestedTags),
    suggestedCategoryNames: parseStringArray(draft.suggestedCategoryNames),
    internalLinkSuggestions: parseInternalLinkSuggestions(draft.internalLinkSuggestions),
    schemaJson: parseSchemaJson(draft.schemaJson) ?? {},
  };
}

export function parseCtaConfig(value: unknown): BlogCtaConfig {
  if (typeof value !== "object" || value === null) {
    return {};
  }

  const config = value as BlogCtaConfig;

  return {
    showCourse: config.showCourse ?? false,
    showRecipe: config.showRecipe ?? false,
    showWorkshop: config.showWorkshop ?? false,
    showMembership: config.showMembership ?? false,
    showNewsletter: config.showNewsletter ?? true,
    courseId: config.courseId ?? null,
    recipeId: config.recipeId ?? null,
    workshopUrl: config.workshopUrl ?? null,
    customHeadline: config.customHeadline ?? null,
  };
}

export const BLOG_STATUS_LABELS: Record<BlogPostStatus, string> = {
  draft: "Entwurf",
  scheduled: "Geplant",
  published: "Veröffentlicht",
  archived: "Archiviert",
};

export const BLOG_SEARCH_INTENT_LABELS: Record<BlogSearchIntent, string> = {
  inform: "Informieren",
  learn: "Lernen",
  buy: "Kaufen",
  compare: "Vergleichen",
  solve: "Problem lösen",
};

export const BLOG_MIN_WORD_COUNT = 300;
export const BLOG_STALE_MONTHS = 12;
