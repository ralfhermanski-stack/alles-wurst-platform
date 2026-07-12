/**
 * @file knowledge-base-service.ts
 * @purpose Wissensdatenbank / FAQ – öffentlich, Admin, Suche, Analytics.
 */

import type { KnowledgeBaseArticleStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import { DEFAULT_KNOWLEDGE_BASE_CATEGORIES } from "./knowledge-base-categories";
import type {
  KnowledgeBaseAnalyticsSummary,
  KnowledgeBaseArticleDetail,
  KnowledgeBaseArticleSummary,
  KnowledgeBaseCategoryEntry,
  KnowledgeBaseSearchResult,
  UpsertKnowledgeBaseArticleInput,
} from "./knowledge-base-types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[äÄ]/g, "ae")
    .replace(/[öÖ]/g, "oe")
    .replace(/[üÜ]/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function sanitizeContent(value: string): string {
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/<[^>]*>/g, "")
    .trim();
}

function toSummary(article: {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  categoryId: string;
  keywords: string[];
  status: KnowledgeBaseArticleStatus;
  visibility: string;
  sortOrder: number;
  viewCount: number;
  publishedAt: Date | null;
  updatedAt: Date;
  category: { name: string; slug: string };
}): KnowledgeBaseArticleSummary {
  return {
    id: article.id,
    slug: article.slug,
    title: article.title,
    summary: article.summary,
    categoryId: article.categoryId,
    categoryName: article.category.name,
    categorySlug: article.category.slug,
    keywords: article.keywords,
    status: article.status,
    visibility: article.visibility as KnowledgeBaseArticleSummary["visibility"],
    sortOrder: article.sortOrder,
    viewCount: article.viewCount,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    updatedAt: article.updatedAt.toISOString(),
  };
}

export async function ensureDefaultKnowledgeBaseCategories(): Promise<void> {
  for (const category of DEFAULT_KNOWLEDGE_BASE_CATEGORIES) {
    await prisma.knowledgeBaseCategory.upsert({
      where: { slug: category.slug },
      create: {
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
        isActive: true,
      },
      update: {
        name: category.name,
        sortOrder: category.sortOrder,
        isActive: true,
      },
    });
  }
}

export async function listKnowledgeBaseCategories(
  includeInactive = false,
): Promise<KnowledgeBaseCategoryEntry[]> {
  await ensureDefaultKnowledgeBaseCategories();

  const categories = await prisma.knowledgeBaseCategory.findMany({
    where: includeInactive ? undefined : { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          articles: {
            where: { status: "published" },
          },
        },
      },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    articleCount: category._count.articles,
  }));
}

export async function searchPublishedKnowledgeBaseArticles(
  query: string,
  options: {
    categorySlug?: string;
    userId?: string | null;
    limit?: number;
    logSearch?: boolean;
    sourcePage?: string;
  } = {},
): Promise<KnowledgeBaseSearchResult> {
  await ensureDefaultKnowledgeBaseCategories();

  const trimmed = query.trim();
  const limit = options.limit ?? 50;

  const where: Prisma.KnowledgeBaseArticleWhereInput = {
    status: "published",
    visibility: options.userId ? undefined : "public",
  };

  if (options.categorySlug) {
    where.category = { slug: options.categorySlug };
  }

  if (trimmed) {
    where.OR = [
      { title: { contains: trimmed, mode: "insensitive" } },
      { summary: { contains: trimmed, mode: "insensitive" } },
      { content: { contains: trimmed, mode: "insensitive" } },
      { keywords: { has: trimmed.toLowerCase() } },
    ];
  }

  const articles = await prisma.knowledgeBaseArticle.findMany({
    where,
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { viewCount: "desc" }, { title: "asc" }],
    take: limit,
  });

  if (options.logSearch !== false && trimmed.length >= 2) {
    await prisma.knowledgeBaseSearchLog.create({
      data: {
        query: trimmed.slice(0, 200),
        resultCount: articles.length,
        hadResults: articles.length > 0,
        userId: options.userId ?? null,
        sourcePage: options.sourcePage ?? "/hilfe/wissen",
      },
    });
  }

  return {
    query: trimmed,
    total: articles.length,
    articles: articles.map(toSummary),
  };
}

export async function getPublishedKnowledgeBaseArticle(
  slug: string,
  userId?: string | null,
  options: { recordView?: boolean } = {},
): Promise<KnowledgeBaseArticleDetail | null> {
  const article = await prisma.knowledgeBaseArticle.findFirst({
    where: {
      slug,
      status: "published",
      visibility: userId ? undefined : "public",
    },
    include: { category: true },
  });

  if (!article) {
    return null;
  }

  if (options.recordView !== false) {
    await prisma.knowledgeBaseArticle.update({
      where: { id: article.id },
      data: { viewCount: { increment: 1 } },
    });
  }

  return {
    ...toSummary(article),
    content: article.content,
  };
}

export async function listAdminKnowledgeBaseArticles(filters: {
  status?: KnowledgeBaseArticleStatus | "all";
  categoryId?: string;
  query?: string;
} = {}): Promise<KnowledgeBaseArticleSummary[]> {
  const where: Prisma.KnowledgeBaseArticleWhereInput = {};

  if (filters.status && filters.status !== "all") {
    where.status = filters.status;
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.query?.trim()) {
    const q = filters.query.trim();
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { summary: { contains: q, mode: "insensitive" } },
      { content: { contains: q, mode: "insensitive" } },
    ];
  }

  const articles = await prisma.knowledgeBaseArticle.findMany({
    where,
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }],
  });

  return articles.map(toSummary);
}

export async function getAdminKnowledgeBaseArticle(
  id: string,
): Promise<KnowledgeBaseArticleDetail | null> {
  const article = await prisma.knowledgeBaseArticle.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!article) {
    return null;
  }

  return {
    ...toSummary(article),
    content: article.content,
  };
}

export async function createKnowledgeBaseArticle(
  input: UpsertKnowledgeBaseArticleInput,
): Promise<UserServiceResult<KnowledgeBaseArticleDetail>> {
  const title = input.title.trim();

  if (!title) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Titel ist erforderlich.",
    });
  }

  const content = sanitizeContent(input.content);

  if (content.length < 20) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Inhalt muss mindestens 20 Zeichen lang sein.",
    });
  }

  const slug = slugify(input.slug?.trim() || title);

  if (!slug) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Slug konnte nicht erzeugt werden.",
    });
  }

  const status = input.status ?? "draft";
  const now = new Date();

  try {
    const article = await prisma.knowledgeBaseArticle.create({
      data: {
        title,
        slug,
        summary: input.summary?.trim() || null,
        content,
        categoryId: input.categoryId,
        keywords: (input.keywords ?? []).map((keyword) =>
          keyword.trim().toLowerCase(),
        ),
        status,
        visibility: input.visibility ?? "public",
        sortOrder: input.sortOrder ?? 0,
        publishedAt: status === "published" ? now : null,
      },
      include: { category: true },
    });

    return userSuccess({
      ...toSummary(article),
      content: article.content,
    });
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "FAQ konnte nicht erstellt werden.",
    });
  }
}

export async function updateKnowledgeBaseArticle(
  id: string,
  input: UpsertKnowledgeBaseArticleInput,
): Promise<UserServiceResult<KnowledgeBaseArticleDetail>> {
  const title = input.title.trim();
  const content = sanitizeContent(input.content);

  if (!title || content.length < 20) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Titel und Inhalt sind unvollständig.",
    });
  }

  const existing = await prisma.knowledgeBaseArticle.findUnique({
    where: { id },
  });

  if (!existing) {
    return userFailure({
      code: "NOT_FOUND",
      message: "FAQ nicht gefunden.",
    });
  }

  const status = input.status ?? existing.status;
  const publishedAt =
    status === "published"
      ? existing.publishedAt ?? new Date()
      : status === "draft"
        ? null
        : existing.publishedAt;

  try {
    const article = await prisma.knowledgeBaseArticle.update({
      where: { id },
      data: {
        title,
        slug: slugify(input.slug?.trim() || title),
        summary: input.summary?.trim() || null,
        content,
        categoryId: input.categoryId,
        keywords: (input.keywords ?? []).map((keyword) =>
          keyword.trim().toLowerCase(),
        ),
        status,
        visibility: input.visibility ?? existing.visibility,
        sortOrder: input.sortOrder ?? existing.sortOrder,
        publishedAt,
      },
      include: { category: true },
    });

    return userSuccess({
      ...toSummary(article),
      content: article.content,
    });
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "FAQ konnte nicht gespeichert werden.",
    });
  }
}

export async function archiveKnowledgeBaseArticle(
  id: string,
): Promise<UserServiceResult<true>> {
  try {
    await prisma.knowledgeBaseArticle.update({
      where: { id },
      data: { status: "archived" },
    });

    return userSuccess(true);
  } catch {
    return userFailure({
      code: "NOT_FOUND",
      message: "FAQ nicht gefunden.",
    });
  }
}

export async function getKnowledgeBaseAnalyticsSummary(): Promise<KnowledgeBaseAnalyticsSummary> {
  const [topSearchesRaw, topArticles, unresolvedSearchesRaw] = await Promise.all([
    prisma.knowledgeBaseSearchLog.groupBy({
      by: ["query"],
      _count: { _all: true },
      orderBy: { _count: { query: "desc" } },
      take: 10,
    }),
    prisma.knowledgeBaseArticle.findMany({
      where: { status: "published" },
      orderBy: { viewCount: "desc" },
      take: 10,
      select: { slug: true, title: true, viewCount: true },
    }),
    prisma.knowledgeBaseSearchLog.groupBy({
      by: ["query"],
      where: { hadResults: false },
      _count: { _all: true },
      orderBy: { _count: { query: "desc" } },
      take: 10,
    }),
  ]);

  const ticketCreationsAfterFaq = await prisma.analyticsEvent.count({
    where: {
      eventType: "help_ticket_from_faq",
    },
  });

  return {
    topSearches: topSearchesRaw.map((row) => ({
      query: row.query,
      count: row._count._all,
    })),
    topArticles,
    unresolvedSearches: unresolvedSearchesRaw.map((row) => ({
      query: row.query,
      count: row._count._all,
    })),
    ticketCreationsAfterFaq,
  };
}

export async function getKnowledgeBaseDraftCount(): Promise<number> {
  return prisma.knowledgeBaseArticle.count({
    where: { status: "draft" },
  });
}
