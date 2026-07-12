/**
 * @file blog-admin-service.ts
 * @purpose Admin-CRUD für Blog/Magazin.
 */

import type { BlogPostStatus, Prisma, UserSystemRole } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { getPublicUserName } from "@/lib/users/public-user";
import { isValidUuid } from "@/lib/tools/recipe-payload-validator";

import {
  canManageBlogTaxonomy,
  canPublishBlogPost,
  canWriteBlogPost,
} from "./blog-permissions";
import { resolveBlogCoverUrl } from "./blog-image-storage";
import {
  calculateReadingTimeMinutes,
  isBlogPostStale,
  runBlogQualityCheck,
  suggestInternalLinks,
} from "./blog-seo";
import { slugifyBlogText, ensureUniqueBlogSlug } from "./blog-slug";
import { DEFAULT_BLOG_TOPIC_CLUSTERS } from "./blog-topic-clusters";
import type {
  BlogAdminListFilters,
  BlogAdminPostDetail,
  BlogCategoryEntry,
  BlogPostSummary,
  BlogQualityReport,
  BlogTagEntry,
  BlogTopicEntry,
  CreateBlogPostInput,
  UpdateBlogPostInput,
} from "./blog-types";
import {
  parseCtaConfig,
  parseDefinitionBoxes,
  parseFaqItems,
  parseInternalLinkSuggestions,
  parseInternalLinks,
  parseSchemaJson,
  parseStoredSeoDraft,
  parseStringArray,
} from "./blog-types";

const postInclude = {
  author: { include: { profile: true } },
  category: true,
  tags: { include: { tag: true } },
  topics: { include: { topic: true } },
} satisfies Prisma.BlogPostInclude;

type PostRow = Prisma.BlogPostGetPayload<{ include: typeof postInclude }>;

export async function ensureDefaultBlogTopics(): Promise<void> {
  for (const cluster of DEFAULT_BLOG_TOPIC_CLUSTERS) {
    await prisma.blogTopicCluster.upsert({
      where: { slug: cluster.slug },
      create: {
        name: cluster.name,
        slug: cluster.slug,
        sortOrder: cluster.sortOrder,
        isActive: true,
      },
      update: {},
    });
  }
}

export async function processScheduledBlogPosts(): Promise<number> {
  const now = new Date();

  const result = await prisma.blogPost.updateMany({
    where: {
      status: "scheduled",
      scheduledAt: { lte: now },
    },
    data: {
      status: "published",
      publishedAt: now,
    },
  });

  return result.count;
}

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

function mapDetail(row: PostRow, related: BlogPostSummary[] = []): BlogAdminPostDetail {
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

function buildAdminWhere(filters: BlogAdminListFilters): Prisma.BlogPostWhereInput {
  const where: Prisma.BlogPostWhereInput = {};

  if (filters.status && filters.status !== "all") {
    where.status = filters.status;
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.authorUserId) {
    where.authorUserId = filters.authorUserId;
  }

  if (filters.topicId) {
    where.topics = { some: { topicId: filters.topicId } };
  }

  if (filters.tagId) {
    where.tags = { some: { tagId: filters.tagId } };
  }

  if (filters.query?.trim()) {
    const q = filters.query.trim();

    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { slug: { contains: q, mode: "insensitive" } },
      { focusKeyword: { contains: q, mode: "insensitive" } },
    ];
  }

  return where;
}

export async function listAdminBlogPosts(
  filters: BlogAdminListFilters = {},
): Promise<BlogPostSummary[]> {
  await processScheduledBlogPosts();

  const rows = await prisma.blogPost.findMany({
    where: buildAdminWhere(filters),
    include: postInclude,
    orderBy: [{ updatedAt: "desc" }],
  });

  let summaries = rows.map(mapSummary);

  if (filters.staleOnly) {
    summaries = summaries.filter((post) => post.isStale);
  }

  return summaries;
}

export async function getAdminBlogPostDetail(
  postId: string,
): Promise<BlogAdminPostDetail | null> {
  const row = await prisma.blogPost.findUnique({
    where: { id: postId },
    include: postInclude,
  });

  if (!row) {
    return null;
  }

  const relatedIds = parseStringArray(row.relatedPostIds);
  let related: BlogPostSummary[] = [];

  if (relatedIds.length > 0) {
    const relatedRows = await prisma.blogPost.findMany({
      where: { id: { in: relatedIds } },
      include: postInclude,
    });

    related = relatedRows.map(mapSummary);
  }

  const detail = mapDetail(row, related);

  const duplicates = await prisma.blogPost.findMany({
    where: {
      id: { not: row.id },
      title: { equals: row.title, mode: "insensitive" },
    },
    select: { title: true },
    take: 3,
  });

  detail.qualityReport = runBlogQualityCheck(
    {
      ...detail,
      hasCover: Boolean(row.coverStorageKey),
    },
    { duplicateTitles: duplicates.map((entry) => entry.title) },
  );

  if (detail.linkedCourseIds.length > 0) {
    const courses = await prisma.course.findMany({
      where: { id: { in: detail.linkedCourseIds } },
      select: { id: true, title: true, slug: true },
    });

    detail.linkedCourses = courses;
  }

  detail.seoAnalysisDraft = parseStoredSeoDraft(row.seoAnalysisDraft);

  return detail;
}

export async function createBlogPost(
  authorUserId: string,
  input: CreateBlogPostInput,
): Promise<BlogAdminPostDetail> {
  const title = input.title.trim();

  if (!title) {
    throw new Error("Titel ist erforderlich.");
  }

  const baseSlug = slugifyBlogText(input.slug ?? title);

  if (!baseSlug) {
    throw new Error("Slug ist ungültig.");
  }

  const slug = await ensureUniqueBlogSlug(baseSlug, async (candidate) => {
    const existing = await prisma.blogPost.findUnique({ where: { slug: candidate } });
    return Boolean(existing);
  });

  const body = input.body ?? "";
  const readingTimeMinutes = calculateReadingTimeMinutes(body);

  const row = await prisma.blogPost.create({
    data: {
      title,
      slug,
      excerpt: input.excerpt ?? null,
      summary: input.summary ?? null,
      body,
      authorUserId,
      categoryId: input.categoryId ?? null,
      focusKeyword: input.focusKeyword ?? null,
      readingTimeMinutes,
      tags: input.tagIds?.length
        ? {
            create: input.tagIds.map((tagId) => ({ tagId })),
          }
        : undefined,
      topics: input.topicIds?.length
        ? {
            create: input.topicIds.map((topicId) => ({
              topicId,
              isPrimary: topicId === input.primaryTopicId,
            })),
          }
        : undefined,
    },
    include: postInclude,
  });

  return mapDetail(row);
}

export async function updateBlogPost(
  postId: string,
  role: UserSystemRole,
  currentUserId: string,
  input: UpdateBlogPostInput,
): Promise<BlogAdminPostDetail> {
  if (!isValidUuid(postId)) {
    throw new Error("Ungültige Artikel-ID.");
  }

  const existing = await prisma.blogPost.findUnique({ where: { id: postId } });

  if (!existing) {
    throw new Error("Artikel nicht gefunden.");
  }

  if (!canWriteBlogPost(role, existing.authorUserId, currentUserId)) {
    throw new Error("Keine Berechtigung zum Bearbeiten dieses Artikels.");
  }

  if (input.status && input.status !== existing.status) {
    if (!canPublishBlogPost(role) && input.status !== "draft") {
      throw new Error("Nur berechtigte Redakteure dürfen veröffentlichen.");
    }
  }

  const data: Prisma.BlogPostUpdateInput = {};
  const contentChanged =
    input.body !== undefined
    || input.title !== undefined
    || input.excerpt !== undefined
    || input.summary !== undefined;

  if (input.title !== undefined) {
    data.title = input.title.trim();
  }

  if (input.slug !== undefined) {
    const slug = slugifyBlogText(input.slug);

    if (!slug) {
      throw new Error("Slug ist ungültig.");
    }

    const taken = await prisma.blogPost.findFirst({
      where: { slug, id: { not: postId } },
    });

    if (taken) {
      throw new Error("Slug ist bereits vergeben.");
    }

    data.slug = slug;
  }

  if (input.excerpt !== undefined) data.excerpt = input.excerpt;
  if (input.summary !== undefined) data.summary = input.summary;
  if (input.body !== undefined) {
    data.body = input.body;
    data.readingTimeMinutes = calculateReadingTimeMinutes(input.body);
  }
  if (input.categoryId !== undefined) {
    data.category = input.categoryId
      ? { connect: { id: input.categoryId } }
      : { disconnect: true };
  }
  if (input.focusKeyword !== undefined) data.focusKeyword = input.focusKeyword;
  if (input.secondaryKeywords !== undefined) data.secondaryKeywords = input.secondaryKeywords;
  if (input.longtailKeywords !== undefined) data.longtailKeywords = input.longtailKeywords;
  if (input.keywordNotes !== undefined) data.keywordNotes = input.keywordNotes;
  if (input.searchIntent !== undefined) data.searchIntent = input.searchIntent;
  if (input.questionsToAnswer !== undefined) data.questionsToAnswer = input.questionsToAnswer;
  if (input.internalLinkNotes !== undefined) data.internalLinkNotes = input.internalLinkNotes;
  if (input.seoTitle !== undefined) data.seoTitle = input.seoTitle;
  if (input.metaDescription !== undefined) data.metaDescription = input.metaDescription;
  if (input.canonicalUrl !== undefined) data.canonicalUrl = input.canonicalUrl;
  if (input.coverAltText !== undefined) data.coverAltText = input.coverAltText;
  if (input.ogTitle !== undefined) data.ogTitle = input.ogTitle;
  if (input.ogDescription !== undefined) data.ogDescription = input.ogDescription;
  if (input.twitterTitle !== undefined) data.twitterTitle = input.twitterTitle;
  if (input.twitterDescription !== undefined) data.twitterDescription = input.twitterDescription;
  if (input.seoKeywords !== undefined) data.seoKeywords = input.seoKeywords;
  if (input.seoTagsSuggested !== undefined) data.seoTagsSuggested = input.seoTagsSuggested;
  if (input.schemaJson !== undefined) {
    data.schemaJson = (input.schemaJson ?? undefined) as Prisma.InputJsonValue | undefined;
  }
  if (input.internalLinkSuggestions !== undefined) {
    data.internalLinkSuggestions = input.internalLinkSuggestions as Prisma.InputJsonValue;
  }
  if (input.seoScore !== undefined) data.seoScore = input.seoScore;
  if (input.readabilityScore !== undefined) data.readabilityScore = input.readabilityScore;
  if (input.lastSeoAnalysisAt !== undefined) {
    data.lastSeoAnalysisAt = input.lastSeoAnalysisAt
      ? new Date(input.lastSeoAnalysisAt)
      : null;
  }
  if (input.faqItems !== undefined) data.faqItems = input.faqItems;
  if (input.definitionBoxes !== undefined) data.definitionBoxes = input.definitionBoxes;
  if (input.internalLinks !== undefined) data.internalLinks = input.internalLinks;
  if (input.relatedPostIds !== undefined) data.relatedPostIds = input.relatedPostIds;
  if (input.linkedCourseIds !== undefined) data.linkedCourseIds = input.linkedCourseIds;
  if (input.linkedRecipeIds !== undefined) data.linkedRecipeIds = input.linkedRecipeIds;
  if (input.ctaConfig !== undefined) data.ctaConfig = input.ctaConfig;
  if (input.reviewedByName !== undefined) data.reviewedByName = input.reviewedByName;
  if (input.expertNote !== undefined) data.expertNote = input.expertNote;
  if (input.sourcesNote !== undefined) data.sourcesNote = input.sourcesNote;
  if (input.disclaimerNote !== undefined) data.disclaimerNote = input.disclaimerNote;
  if (input.robotsIndex !== undefined) data.robotsIndex = input.robotsIndex;
  if (input.robotsFollow !== undefined) data.robotsFollow = input.robotsFollow;
  if (input.scheduledAt !== undefined) {
    data.scheduledAt = input.scheduledAt ? new Date(input.scheduledAt) : null;
  }
  if (input.lastReviewedAt !== undefined) {
    data.lastReviewedAt = input.lastReviewedAt ? new Date(input.lastReviewedAt) : null;
  }

  if (input.status !== undefined) {
    data.status = input.status;

    if (input.status === "published" && !existing.publishedAt) {
      data.publishedAt = new Date();
    }

    if (input.status === "draft") {
      data.scheduledAt = null;
    }
  }

  if (contentChanged && existing.status === "published") {
    data.contentUpdatedAt = new Date();
  }

  if (input.tagIds !== undefined) {
    await prisma.blogPostTag.deleteMany({ where: { postId } });

    if (input.tagIds.length > 0) {
      await prisma.blogPostTag.createMany({
        data: input.tagIds.map((tagId) => ({ postId, tagId })),
      });
    }
  }

  if (input.topicIds !== undefined) {
    await prisma.blogPostTopic.deleteMany({ where: { postId } });

    if (input.topicIds.length > 0) {
      await prisma.blogPostTopic.createMany({
        data: input.topicIds.map((topicId) => ({
          postId,
          topicId,
          isPrimary: topicId === input.primaryTopicId,
        })),
      });
    }
  }

  await prisma.blogPost.update({
    where: { id: postId },
    data,
  });

  const detail = await getAdminBlogPostDetail(postId);

  if (!detail) {
    throw new Error("Artikel konnte nicht geladen werden.");
  }

  return detail;
}

export async function publishBlogPost(
  postId: string,
  role: UserSystemRole,
): Promise<BlogAdminPostDetail> {
  if (!canPublishBlogPost(role)) {
    throw new Error("Keine Berechtigung zum Veröffentlichen.");
  }

  const detail = await getAdminBlogPostDetail(postId);

  if (!detail) {
    throw new Error("Artikel nicht gefunden.");
  }

  const report = runBlogQualityCheck({
    ...detail,
    hasCover: Boolean(detail.coverUrl),
  });

  if (!report.canPublish) {
    throw new Error(
      `Veröffentlichung blockiert: ${report.issues.filter((i) => i.severity === "error").map((i) => i.message).join(" ")}`,
    );
  }

  await prisma.blogPost.update({
    where: { id: postId },
    data: {
      status: "published",
      publishedAt: new Date(),
      scheduledAt: null,
    },
  });

  return (await getAdminBlogPostDetail(postId))!;
}

export async function deleteBlogPost(
  postId: string,
  role: UserSystemRole,
  currentUserId: string,
): Promise<void> {
  const existing = await prisma.blogPost.findUnique({ where: { id: postId } });

  if (!existing) {
    throw new Error("Artikel nicht gefunden.");
  }

  if (!canWriteBlogPost(role, existing.authorUserId, currentUserId)) {
    throw new Error("Keine Berechtigung.");
  }

  await prisma.blogPost.delete({ where: { id: postId } });
}

export async function getBlogQualityReport(postId: string): Promise<BlogQualityReport | null> {
  const detail = await getAdminBlogPostDetail(postId);
  return detail?.qualityReport ?? null;
}

export async function listBlogCategories(activeOnly = false): Promise<BlogCategoryEntry[]> {
  const rows = await prisma.blogCategory.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { posts: true } },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
    postCount: row._count.posts,
  }));
}

export async function createBlogCategory(
  role: UserSystemRole,
  input: { name: string; slug?: string; description?: string | null },
): Promise<BlogCategoryEntry> {
  if (!canManageBlogTaxonomy(role)) {
    throw new Error("Keine Berechtigung.");
  }

  const name = input.name.trim();
  const slug = slugifyBlogText(input.slug ?? name);

  const row = await prisma.blogCategory.create({
    data: {
      name,
      slug,
      description: input.description ?? null,
    },
  });

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  };
}

export async function listBlogTags(): Promise<BlogTagEntry[]> {
  const rows = await prisma.blogTag.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { posts: true } } },
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    postCount: row._count.posts,
  }));
}

export async function upsertBlogTag(
  role: UserSystemRole,
  name: string,
): Promise<BlogTagEntry> {
  if (!canManageBlogTaxonomy(role)) {
    throw new Error("Keine Berechtigung.");
  }

  const trimmed = name.trim();
  const slug = slugifyBlogText(trimmed);

  const row = await prisma.blogTag.upsert({
    where: { slug },
    create: { name: trimmed, slug },
    update: { name: trimmed },
  });

  return { id: row.id, name: row.name, slug: row.slug };
}

export async function listBlogTopics(): Promise<BlogTopicEntry[]> {
  await ensureDefaultBlogTopics();

  const rows = await prisma.blogTopicCluster.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sortOrder,
    isActive: row.isActive,
  }));
}

export async function getBlogLinkSuggestions(postId: string): Promise<
  { label: string; url: string; reason: string }[]
> {
  const post = await prisma.blogPost.findUnique({ where: { id: postId } });

  if (!post) {
    return [];
  }

  const [posts, courses] = await Promise.all([
    prisma.blogPost.findMany({
      where: {
        status: "published",
        id: { not: postId },
      },
      select: { title: true, slug: true, focusKeyword: true },
      take: 50,
    }),
    prisma.course.findMany({
      where: { status: "published" },
      select: { title: true, slug: true },
      take: 20,
    }),
  ]);

  const candidates = [
    ...posts.map((entry) => ({
      title: entry.title,
      url: `/magazin/${entry.slug}`,
      keywords: [entry.title, entry.focusKeyword ?? ""].filter(Boolean),
    })),
    ...courses.map((entry) => ({
      title: entry.title,
      url: `/akademie/kurse/${entry.slug}`,
      keywords: [entry.title],
    })),
  ];

  return suggestInternalLinks(post.body, candidates);
}

export async function getRelatedBlogPosts(
  postId: string,
  limit = 4,
): Promise<BlogPostSummary[]> {
  const post = await prisma.blogPost.findUnique({
    where: { id: postId },
    include: postInclude,
  });

  if (!post) {
    return [];
  }

  const manualIds = parseStringArray(post.relatedPostIds);

  if (manualIds.length > 0) {
    const rows = await prisma.blogPost.findMany({
      where: { id: { in: manualIds }, status: "published" },
      include: postInclude,
      take: limit,
    });

    if (rows.length >= limit) {
      return rows.map(mapSummary);
    }
  }

  const topicIds = post.topics.map((entry) => entry.topicId);

  const rows = await prisma.blogPost.findMany({
    where: {
      id: { not: postId },
      status: "published",
      OR: [
        topicIds.length > 0 ? { topics: { some: { topicId: { in: topicIds } } } } : undefined,
        post.categoryId ? { categoryId: post.categoryId } : undefined,
        post.focusKeyword
          ? { focusKeyword: { equals: post.focusKeyword, mode: "insensitive" } }
          : undefined,
      ].filter(Boolean) as Prisma.BlogPostWhereInput[],
    },
    include: postInclude,
    orderBy: [{ viewCount: "desc" }, { publishedAt: "desc" }],
    take: limit,
  });

  return rows.map(mapSummary);
}

export async function listBlogPostsForSitemap(): Promise<
  { slug: string; updatedAt: Date; publishedAt: Date | null; contentUpdatedAt: Date | null }[]
> {
  await processScheduledBlogPosts();

  return prisma.blogPost.findMany({
    where: { status: "published", robotsIndex: true },
    select: { slug: true, updatedAt: true, publishedAt: true, contentUpdatedAt: true },
    orderBy: { updatedAt: "desc" },
  });
}
