/**
 * @file knowledge-base-types.ts
 */

import type {
  KnowledgeBaseArticleStatus,
  KnowledgeBaseVisibility,
} from "@prisma/client";

export type KnowledgeBaseCategoryEntry = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  articleCount?: number;
};

export type KnowledgeBaseArticleSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  keywords: string[];
  status: KnowledgeBaseArticleStatus;
  visibility: KnowledgeBaseVisibility;
  sortOrder: number;
  viewCount: number;
  publishedAt: string | null;
  updatedAt: string;
};

export type KnowledgeBaseArticleDetail = KnowledgeBaseArticleSummary & {
  content: string;
};

export type KnowledgeBaseSearchResult = {
  articles: KnowledgeBaseArticleSummary[];
  query: string;
  total: number;
};

export type KnowledgeBaseAnalyticsSummary = {
  topSearches: { query: string; count: number }[];
  topArticles: { slug: string; title: string; viewCount: number }[];
  unresolvedSearches: { query: string; count: number }[];
  ticketCreationsAfterFaq: number;
};

export type UpsertKnowledgeBaseArticleInput = {
  title: string;
  slug?: string;
  summary?: string | null;
  content: string;
  categoryId: string;
  keywords?: string[];
  status?: KnowledgeBaseArticleStatus;
  visibility?: KnowledgeBaseVisibility;
  sortOrder?: number;
};
