/**
 * @file blog-service.ts
 * @purpose Öffentliche Blog-/Magazin-Abfragen.
 */

import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getPublicUserName } from "@/lib/users/public-user";

import { resolveBlogCoverUrl } from "./blog-image-storage";
import {
  getRelatedBlogPosts,
  processScheduledBlogPosts,
} from "./blog-admin-service";
import { isBlogPostStale } from "./blog-seo";
import type { BlogPostDetail, BlogPostSummary, BlogPublicListFilters } from "./blog-types";
import {
  parseCtaConfig,
  parseDefinitionBoxes,
  parseFaqItems,
  parseInternalLinkSuggestions,
  parseInternalLinks,
  parseSchemaJson,
  parseStringArray,
} from "./blog-types";

const postInclude = {
  author: { include: { profile: true } },
  category: true,
  tags: { include: { tag: true } },
  topics: { include: { topic: true } },
} satisfies Prisma.BlogPostInclude;

type PostRow = Prisma.BlogPostGetPayload<{ include: typeof postInclude }>;

function mapSummary(row: PostRow): BlogPostSummary {
  const primaryTopic = row.topics.find((entry) => entry.isPrimary)?.topic
    ?? row.topics[0]?.topic
    ?? null;

  const publishedAt = row.publishedAt?.toISOString() ?? null;
  const contentUpdatedAt = row.contentUpdatedAt?.toISOString() ?? null;

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    summary: row.summary,
    status: row.status,
    categoryName: row.category?.name ?? null,
    categorySlug: row.category?.slug ?? null,
    authorDisplayName: getPublicUserName({ profile: row.author.profile }),
    coverUrl: resolveBlogCoverUrl(row),
    coverAltText: row.coverAltText,
    readingTimeMinutes: row.readingTimeMinutes,
    publishedAt,
    contentUpdatedAt,
    updatedAt: row.updatedAt.toISOString(),
    viewCount: row.viewCount,
    focusKeyword: row.focusKeyword,
    primaryTopicName: primaryTopic?.name ?? null,
    primaryTopicSlug: primaryTopic?.slug ?? null,
    tagNames: row.tags.map((entry) => entry.tag.name),
    isStale: isBlogPostStale(publishedAt, contentUpdatedAt),
  };
}

function mapDetail(row: PostRow, related: BlogPostSummary[]): BlogPostDetail {
  const summary = mapSummary(row);

  return {
    ...summary,
    body: row.body,
    seoTitle: row.seoTitle,
    metaDescription: row.metaDescription,
    canonicalUrl: row.canonicalUrl,
    secondaryKeywords: parseStringArray(row.secondaryKeywords),
    longtailKeywords: parseStringArray(row.longtailKeywords),
    keywordNotes: row.keywordNotes,
    searchIntent: row.searchIntent,
    questionsToAnswer: parseStringArray(row.questionsToAnswer),
    internalLinkNotes: row.internalLinkNotes,
    faqItems: parseFaqItems(row.faqItems),
    definitionBoxes: parseDefinitionBoxes(row.definitionBoxes),
    internalLinks: parseInternalLinks(row.internalLinks),
    relatedPostIds: parseStringArray(row.relatedPostIds),
    linkedCourseIds: parseStringArray(row.linkedCourseIds),
    linkedRecipeIds: parseStringArray(row.linkedRecipeIds),
    ctaConfig: parseCtaConfig(row.ctaConfig),
    reviewedByName: row.reviewedByName,
    expertNote: row.expertNote,
    sourcesNote: row.sourcesNote,
    disclaimerNote: row.disclaimerNote,
    robotsIndex: row.robotsIndex,
    robotsFollow: row.robotsFollow,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    lastReviewedAt: row.lastReviewedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    authorUserId: row.authorUserId,
    categoryId: row.categoryId,
    tagIds: row.tags.map((entry) => entry.tagId),
    topicIds: row.topics.map((entry) => entry.topicId),
    primaryTopicId:
      row.topics.find((entry) => entry.isPrimary)?.topicId
      ?? row.topics[0]?.topicId
      ?? null,
    relatedPosts: related,
    linkedCourses: [],
    ogTitle: row.ogTitle,
    ogDescription: row.ogDescription,
    twitterTitle: row.twitterTitle,
    twitterDescription: row.twitterDescription,
    seoKeywords: parseStringArray(row.seoKeywords),
    seoTagsSuggested: parseStringArray(row.seoTagsSuggested),
    schemaJson: parseSchemaJson(row.schemaJson),
    internalLinkSuggestions: parseInternalLinkSuggestions(row.internalLinkSuggestions),
    seoScore: row.seoScore,
    readabilityScore: row.readabilityScore,
    lastSeoAnalysisAt: row.lastSeoAnalysisAt?.toISOString() ?? null,
  };
}

function buildPublicWhere(filters: BlogPublicListFilters): Prisma.BlogPostWhereInput {
  const where: Prisma.BlogPostWhereInput = {
    status: "published",
    robotsIndex: true,
  };

  if (filters.categorySlug) {
    where.category = { slug: filters.categorySlug, isActive: true };
  }

  if (filters.tagSlug) {
    where.tags = { some: { tag: { slug: filters.tagSlug } } };
  }

  if (filters.topicSlug) {
    where.topics = { some: { topic: { slug: filters.topicSlug, isActive: true } } };
  }

  if (filters.query?.trim()) {
    const q = filters.query.trim();

    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { excerpt: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
      { body: { contains: q, mode: "insensitive" } },
      { focusKeyword: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function listPublicBlogPosts(
  filters: BlogPublicListFilters = {},
): Promise<{ posts: BlogPostSummary[]; total: number }> {
  await processScheduledBlogPosts();

  const where = buildPublicWhere(filters);
  const limit = Math.min(filters.limit ?? 12, 50);
  const offset = filters.offset ?? 0;

  const orderBy: Prisma.BlogPostOrderByWithRelationInput[] =
    filters.sort === "popular"
      ? [{ viewCount: "desc" }, { publishedAt: "desc" }]
      : [{ publishedAt: "desc" }];

  const [rows, total] = await Promise.all([
    prisma.blogPost.findMany({
      where,
      include: postInclude,
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.blogPost.count({ where }),
  ]);

  return { posts: rows.map(mapSummary), total };
}

export async function getPublicBlogPostBySlug(slug: string): Promise<BlogPostDetail | null> {
  await processScheduledBlogPosts();

  const row = await prisma.blogPost.findFirst({
    where: {
      slug,
      status: "published",
    },
    include: postInclude,
  });

  if (!row) {
    return null;
  }

  await prisma.blogPost.update({
    where: { id: row.id },
    data: { viewCount: { increment: 1 } },
  });

  const related = await getRelatedBlogPosts(row.id);
  const detail = mapDetail(row, related);

  if (detail.linkedCourseIds.length > 0) {
    const courses = await prisma.course.findMany({
      where: {
        id: { in: detail.linkedCourseIds },
        status: "published",
      },
      select: { id: true, title: true, slug: true },
    });

    detail.linkedCourses = courses;
  }

  return detail;
}

export async function getHomepageBlogPosts(limit = 3): Promise<BlogPostSummary[]> {
  await processScheduledBlogPosts();

  const rows = await prisma.blogPost.findMany({
    where: {
      status: "published",
      robotsIndex: true,
    },
    include: postInclude,
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: limit,
  });

  return rows.map(mapSummary);
}

export async function getLatestBlogPosts(limit = 3): Promise<BlogPostSummary[]> {
  return getHomepageBlogPosts(limit);
}

export async function getPopularBlogPosts(limit = 5): Promise<BlogPostSummary[]> {
  const result = await listPublicBlogPosts({ limit, sort: "popular" });
  return result.posts;
}

export async function getBlogPostCoverMeta(postId: string): Promise<{
  storageKey: string;
  mimeType: string;
} | null> {
  const row = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: { coverStorageKey: true, coverMimeType: true, status: true },
  });

  if (!row?.coverStorageKey || !row.coverMimeType) {
    return null;
  }

  if (row.status !== "published") {
    return null;
  }

  return {
    storageKey: row.coverStorageKey,
    mimeType: row.coverMimeType,
  };
}

export async function getBlogPostCoverMetaForAdmin(postId: string): Promise<{
  storageKey: string;
  mimeType: string;
} | null> {
  const row = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: { coverStorageKey: true, coverMimeType: true },
  });

  if (!row?.coverStorageKey || !row.coverMimeType) {
    return null;
  }

  return {
    storageKey: row.coverStorageKey,
    mimeType: row.coverMimeType,
  };
}

export async function getBlogPreviewPost(
  postId: string,
  previewToken?: string,
): Promise<BlogPostDetail | null> {
  if (previewToken !== postId) {
    return null;
  }

  const row = await prisma.blogPost.findUnique({
    where: { id: postId },
    include: postInclude,
  });

  if (!row) {
    return null;
  }

  const related = await getRelatedBlogPosts(row.id);
  return mapDetail(row, related);
}
