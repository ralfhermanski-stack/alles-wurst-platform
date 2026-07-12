/**
 * @file blog-seo-analyze-service.ts
 * @purpose SEO-Analyse auslösen, speichern und auf Artikel anwenden.
 */

import { prisma } from "@/lib/db/prisma";
import type { Prisma, UserSystemRole } from "@prisma/client";

import { getBlogLinkSuggestions, updateBlogPost, upsertBlogTag } from "./blog-admin-service";
import { analyzeBlogSeoContent, isValidSchemaJson } from "./blog-seo-ai-service";
import { extractHeadingsFromMarkdown, markdownToPlainText } from "./blog-seo-text-utils";
import type { BlogSeoAnalysisInput, BlogSeoAnalysisResult } from "./blog-types";
import { parseStoredSeoDraft } from "./blog-types";
import { canWriteBlogPost } from "./blog-permissions";

function buildAnalysisInput(
  row: NonNullable<Awaited<ReturnType<typeof loadPostForAnalysis>>>,
): BlogSeoAnalysisInput {
  return {
    postId: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    summary: row.summary,
    body: row.body,
    coverAltText: row.coverAltText,
    coverUrl: row.coverStorageKey ? `/api/blog/images/${row.id}?preview=${row.id}` : null,
    categoryId: row.categoryId,
    categoryName: row.category?.name ?? null,
    categorySlug: row.category?.slug ?? null,
    authorDisplayName: row.author.profile?.publicName
      ?? row.author.profile?.firstName
      ?? row.author.email,
    authorUserId: row.authorUserId,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    contentUpdatedAt: row.contentUpdatedAt?.toISOString() ?? null,
    updatedAt: row.updatedAt.toISOString(),
    readingTimeMinutes: row.readingTimeMinutes,
    tagNames: row.tags.map((entry) => entry.tag.name),
    headings: extractHeadingsFromMarkdown(row.body),
    plainText: markdownToPlainText(row.body),
  };
}

async function loadPostForAnalysis(postId: string) {
  return prisma.blogPost.findUnique({
    where: { id: postId },
    include: {
      category: true,
      tags: { include: { tag: true } },
      author: { include: { profile: true } },
    },
  });
}

async function getLinkCandidates(postId: string) {
  const suggestions = await getBlogLinkSuggestions(postId);
  return suggestions.map((entry) => ({
    title: entry.label,
    url: entry.url,
    keywords: [entry.label],
  }));
}

export async function runBlogSeoAnalysis(
  postId: string,
): Promise<BlogSeoAnalysisResult> {
  const row = await loadPostForAnalysis(postId);

  if (!row) {
    throw new Error("Artikel nicht gefunden.");
  }

  const input = buildAnalysisInput(row);
  const linkCandidates = await getLinkCandidates(postId);
  const result = await analyzeBlogSeoContent(input, linkCandidates);

  await prisma.blogPost.update({
    where: { id: postId },
    data: {
      seoAnalysisDraft: result as object,
      seoScore: result.seoScore,
      readabilityScore: result.readabilityScore,
      lastSeoAnalysisAt: new Date(),
    },
  });

  return result;
}

export async function applyBlogSeoAnalysis(
  postId: string,
  role: UserSystemRole,
  userId: string,
  draft?: BlogSeoAnalysisResult,
): Promise<BlogSeoAnalysisResult> {
  const row = await loadPostForAnalysis(postId);

  if (!row) {
    throw new Error("Artikel nicht gefunden.");
  }

  if (!canWriteBlogPost(role, row.authorUserId, userId)) {
    throw new Error("Keine Berechtigung.");
  }

  let analysis: BlogSeoAnalysisResult | undefined = draft;

  if (!analysis) {
    const stored = row.seoAnalysisDraft;

    if (!stored || typeof stored !== "object") {
      throw new Error("Keine SEO-Analyse vorhanden. Bitte zuerst analysieren.");
    }

    const parsed = parseStoredSeoDraft(stored);

    if (!parsed) {
      throw new Error("Gespeicherte SEO-Analyse ist ungültig.");
    }

    analysis = parsed;
  }

  const categories = await prisma.blogCategory.findMany({
    where: { isActive: true },
  });

  let categoryId = row.categoryId;

  for (const name of analysis.suggestedCategoryNames) {
    const match = categories.find(
      (category) => category.name.toLowerCase() === name.toLowerCase(),
    );

    if (match) {
      categoryId = match.id;
      break;
    }
  }

  const tagIds = [...row.tags.map((entry) => entry.tagId)];

  for (const tagName of analysis.suggestedTags.slice(0, 5)) {
    const tag = await upsertBlogTag(role, tagName);
    if (!tagIds.includes(tag.id)) {
      tagIds.push(tag.id);
    }
  }

  await updateBlogPost(postId, role, userId, {
    seoTitle: analysis.seoTitle,
    metaDescription: analysis.metaDescription,
    focusKeyword: analysis.focusKeyword,
    secondaryKeywords: analysis.seoKeywords,
    summary: analysis.aiSummary,
    excerpt: row.excerpt ?? analysis.aiSummary.slice(0, 180),
    coverAltText: analysis.imageAltText,
    faqItems: analysis.faqItems,
    canonicalUrl: row.canonicalUrl,
    categoryId,
    tagIds,
    internalLinks: analysis.internalLinkSuggestions.map((entry) => ({
      label: entry.label,
      url: entry.url,
    })),
  });

  await prisma.blogPost.update({
    where: { id: postId },
    data: {
      ogTitle: analysis.ogTitle,
      ogDescription: analysis.ogDescription,
      twitterTitle: analysis.twitterTitle,
      twitterDescription: analysis.twitterDescription,
      seoKeywords: analysis.seoKeywords,
      seoTagsSuggested: analysis.suggestedTags,
      schemaJson: isValidSchemaJson(analysis.schemaJson)
        ? (analysis.schemaJson as Prisma.InputJsonValue)
        : undefined,
      internalLinkSuggestions:
        analysis.internalLinkSuggestions as Prisma.InputJsonValue,
      seoScore: analysis.seoScore,
      readabilityScore: analysis.readabilityScore,
    },
  });

  return analysis;
}

export async function validateBlogPostSchema(postId: string): Promise<{
  valid: boolean;
  schema: Record<string, unknown> | null;
  message: string;
}> {
  const row = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: { schemaJson: true, seoAnalysisDraft: true },
  });

  if (!row) {
    return { valid: false, schema: null, message: "Artikel nicht gefunden." };
  }

  const schema = row.schemaJson as Record<string, unknown> | null;

  if (!schema || !isValidSchemaJson(schema)) {
    return {
      valid: false,
      schema: null,
      message: "Kein gültiges Schema.org JSON vorhanden.",
    };
  }

  return {
    valid: true,
    schema,
    message: "Schema.org JSON-LD ist gültig.",
  };
}

export async function getBlogSeoDraftForPost(
  postId: string,
): Promise<BlogSeoAnalysisResult | null> {
  const row = await prisma.blogPost.findUnique({
    where: { id: postId },
    select: {
      seoAnalysisDraft: true,
    },
  });

  if (!row?.seoAnalysisDraft) {
    return null;
  }

  return parseStoredSeoDraft(row.seoAnalysisDraft);
}
