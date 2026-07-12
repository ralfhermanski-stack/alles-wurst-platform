/**
 * @file blog-seo-ai-service.ts
 * @purpose Automatische SEO- & KI-Analyse für Blogartikel (OpenAI + Fallback).
 */

import {
  assessReadability,
  buildBlogPostingJsonLd,
  estimateKeywordDensity,
  getBlogPostUrl,
  runBlogQualityCheck,
  suggestInternalLinks,
} from "./blog-seo";
import {
  clampMetaDescription,
  computeReadabilityScore,
  extractFrequentKeywords,
  extractHeadingsFromMarkdown,
  extractParagraphAfterHeading,
  markdownToPlainText,
  truncateSeoTitle,
} from "./blog-seo-text-utils";
import type { BlogFaqItem, BlogSeoAnalysisInput, BlogSeoAnalysisResult } from "./blog-types";
import { parseFaqItems, parseStringArray } from "./blog-types";

const SYSTEM_PROMPT = `Du bist ein SEO- und Content-Assistent für alles-wurst.de (Fleischermeister, Wurst, Räuchern).
Antworte NUR mit validem JSON auf Deutsch.
Erfinde KEINE Fakten. Leite alles ausschließlich aus dem gelieferten Artikeltext ab.
Bei Unsicherheit formuliere neutral ("Der Artikel beschreibt …").
Kein Keyword-Stuffing. Meta Description 140–160 Zeichen. SEO-Titel max. 60 Zeichen.
FAQ nur wenn die Antwort im Text steht.`;

type RawAiResponse = {
  seoTitle?: unknown;
  metaDescription?: unknown;
  focusKeyword?: unknown;
  seoKeywords?: unknown;
  suggestedTags?: unknown;
  suggestedCategoryNames?: unknown;
  aiSummary?: unknown;
  faqItems?: unknown;
  imageAltText?: unknown;
  ogTitle?: unknown;
  ogDescription?: unknown;
  twitterTitle?: unknown;
  twitterDescription?: unknown;
  warnings?: unknown;
};

export function validateBlogSeoAnalysis(raw: unknown): BlogSeoAnalysisResult | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const data = raw as RawAiResponse;

  const seoTitle = typeof data.seoTitle === "string" ? truncateSeoTitle(data.seoTitle) : "";
  const metaDescription =
    typeof data.metaDescription === "string"
      ? clampMetaDescription(data.metaDescription)
      : "";
  const focusKeyword =
    typeof data.focusKeyword === "string" ? data.focusKeyword.trim() : "";
  const aiSummary = typeof data.aiSummary === "string" ? data.aiSummary.trim() : "";
  const imageAltText =
    typeof data.imageAltText === "string" ? data.imageAltText.trim() : "";

  if (!seoTitle || !metaDescription || !focusKeyword) {
    return null;
  }

  const faqItems = parseFaqItems(data.faqItems).slice(0, 6);
  const seoKeywords = parseStringArray(data.seoKeywords).slice(0, 12);
  const suggestedTags = parseStringArray(data.suggestedTags).slice(0, 10);
  const suggestedCategoryNames = parseStringArray(data.suggestedCategoryNames).slice(0, 3);
  const warnings = parseStringArray(data.warnings);

  const ogTitle = truncateSeoTitle(
    typeof data.ogTitle === "string" ? data.ogTitle : seoTitle,
  );
  const ogDescription = clampMetaDescription(
    typeof data.ogDescription === "string" ? data.ogDescription : metaDescription,
  );
  const twitterTitle = truncateSeoTitle(
    typeof data.twitterTitle === "string" ? data.twitterTitle : seoTitle,
  );
  const twitterDescription = clampMetaDescription(
    typeof data.twitterDescription === "string"
      ? data.twitterDescription
      : metaDescription,
  );

  return {
    seoTitle,
    metaDescription,
    focusKeyword,
    seoKeywords,
    suggestedTags,
    suggestedCategoryNames,
    aiSummary,
    faqItems,
    imageAltText,
    ogTitle,
    ogDescription,
    twitterTitle,
    twitterDescription,
    internalLinkSuggestions: [],
    schemaJson: {},
    seoScore: 0,
    readabilityScore: 0,
    source: "ai",
    warnings,
    analyzedAt: new Date().toISOString(),
  };
}

function buildPrompt(input: BlogSeoAnalysisInput): string {
  return JSON.stringify(
    {
      instruction:
        "Analysiere den Artikel und gib JSON zurück mit: seoTitle, metaDescription (140-160 Zeichen), focusKeyword, seoKeywords (Array), suggestedTags (Array), suggestedCategoryNames (Array), aiSummary (2-3 Sätze), faqItems ([{question,answer}]), imageAltText, ogTitle, ogDescription, twitterTitle, twitterDescription, warnings (Array optional)",
      title: input.title,
      slug: input.slug,
      excerpt: input.excerpt,
      summary: input.summary,
      coverAltText: input.coverAltText,
      headings: input.headings,
      plainText: input.plainText.slice(0, 12000),
    },
    null,
    2,
  );
}

async function callOpenAiAnalysis(
  input: BlogSeoAnalysisInput,
): Promise<BlogSeoAnalysisResult | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  if (!apiKey) {
    return null;
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildPrompt(input) },
        ],
      }),
    });

    if (!response.ok) {
      console.warn("[blog-seo-ai] OpenAI Fehler:", response.status);
      return null;
    }

    const payload = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };

    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      return null;
    }

    const parsed = JSON.parse(content) as unknown;
    return validateBlogSeoAnalysis(parsed);
  } catch (error) {
    console.warn("[blog-seo-ai] OpenAI-Aufruf fehlgeschlagen:", error);
    return null;
  }
}

function buildFallbackFaq(body: string, headings: string[]): BlogFaqItem[] {
  const faqItems: BlogFaqItem[] = [];

  for (const heading of headings.slice(0, 4)) {
    const answer = extractParagraphAfterHeading(body, heading);

    if (answer.length < 40) {
      continue;
    }

    faqItems.push({
      question: heading.endsWith("?") ? heading : `${heading}?`,
      answer: answer.slice(0, 400),
    });
  }

  return faqItems;
}

export function buildFallbackSeoAnalysis(
  input: BlogSeoAnalysisInput,
  linkCandidates: { title: string; url: string; keywords: string[] }[] = [],
): BlogSeoAnalysisResult {
  const plainText = input.plainText || markdownToPlainText(input.body);
  const keywords = extractFrequentKeywords(plainText);
  const focusKeyword = keywords[0] ?? input.title.split(/\s+/).slice(0, 2).join(" ").toLowerCase();

  const descriptionSource =
    input.excerpt?.trim()
    || input.summary?.trim()
    || plainText.slice(0, 220);

  let metaDescription = clampMetaDescription(descriptionSource);

  if (metaDescription.length < 140) {
    metaDescription = clampMetaDescription(
      `${descriptionSource} ${plainText}`.replace(/\s+/g, " ").trim(),
    );
  }
  const seoTitle = truncateSeoTitle(input.title);
  const aiSummary =
    input.summary?.trim()
    || truncateTextSentences(plainText, 2);

  const headings = input.headings.length > 0
    ? input.headings
    : extractHeadingsFromMarkdown(input.body);

  const faqItems = buildFallbackFaq(input.body, headings);
  const imageAltText =
    input.coverAltText?.trim()
    || `Beitragsbild: ${input.title}`;

  const internalLinkSuggestions = suggestInternalLinks(input.body, linkCandidates);

  const partialPost = {
    id: input.postId,
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    summary: aiSummary,
    body: input.body,
    metaDescription,
    seoTitle,
    focusKeyword,
    coverUrl: input.coverUrl,
    coverAltText: imageAltText,
    authorDisplayName: input.authorDisplayName,
    authorUserId: input.authorUserId,
    categoryName: input.categoryName,
    categorySlug: input.categorySlug,
    publishedAt: input.publishedAt,
    contentUpdatedAt: input.contentUpdatedAt,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    readingTimeMinutes: input.readingTimeMinutes,
    tagNames: input.tagNames,
    faqItems,
    robotsIndex: true,
    robotsFollow: true,
    canonicalUrl: null,
  };

  const schemaJson = buildBlogPostingJsonLd(partialPost as never);

  const readabilityScore = computeReadabilityScore(input.body);
  const quality = runBlogQualityCheck({
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    summary: aiSummary,
    body: input.body,
    metaDescription,
    focusKeyword,
    categoryId: input.categoryId,
    coverAltText: imageAltText,
    internalLinks: internalLinkSuggestions.map((entry) => ({
      label: entry.label,
      url: entry.url,
    })),
    faqItems,
    seoTitle,
    relatedPostIds: [],
    hasCover: Boolean(input.coverUrl),
  });

  return {
    seoTitle,
    metaDescription,
    focusKeyword,
    seoKeywords: keywords,
    suggestedTags: keywords.slice(0, 5),
    suggestedCategoryNames: input.categoryName ? [input.categoryName] : [],
    aiSummary,
    faqItems,
    imageAltText,
    ogTitle: seoTitle,
    ogDescription: metaDescription,
    twitterTitle: seoTitle,
    twitterDescription: metaDescription,
    internalLinkSuggestions,
    schemaJson,
    seoScore: quality.seoScore,
    readabilityScore,
    source: "fallback",
    warnings: [
      "Analyse ohne KI (OPENAI_API_KEY fehlt oder KI nicht erreichbar).",
      ...(estimateKeywordDensity(input.body, focusKeyword) > 3
        ? ["Fokus-Keyword könnte zu häufig vorkommen."]
        : []),
    ],
    analyzedAt: new Date().toISOString(),
  };
}

function truncateTextSentences(text: string, count: number): string {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, count).join(" ").trim();
}

export function enrichSeoAnalysisResult(
  result: BlogSeoAnalysisResult,
  input: BlogSeoAnalysisInput,
  linkCandidates: { title: string; url: string; keywords: string[] }[] = [],
): BlogSeoAnalysisResult {
  const internalLinkSuggestions =
    result.internalLinkSuggestions.length > 0
      ? result.internalLinkSuggestions
      : suggestInternalLinks(input.body, linkCandidates);

  const partialPost = {
    id: input.postId,
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    summary: result.aiSummary,
    body: input.body,
    metaDescription: result.metaDescription,
    seoTitle: result.seoTitle,
    focusKeyword: result.focusKeyword,
    coverUrl: input.coverUrl,
    coverAltText: result.imageAltText,
    authorDisplayName: input.authorDisplayName,
    authorUserId: input.authorUserId,
    categoryName: input.categoryName,
    categorySlug: input.categorySlug,
    publishedAt: input.publishedAt,
    contentUpdatedAt: input.contentUpdatedAt,
    updatedAt: input.updatedAt ?? new Date().toISOString(),
    readingTimeMinutes: input.readingTimeMinutes,
    tagNames: result.suggestedTags,
    faqItems: result.faqItems,
    robotsIndex: true,
    robotsFollow: true,
    canonicalUrl: getBlogPostUrl(input.slug),
  };

  const schemaJson =
    Object.keys(result.schemaJson).length > 0
      ? result.schemaJson
      : buildBlogPostingJsonLd(partialPost as never);

  const quality = runBlogQualityCheck({
    title: input.title,
    slug: input.slug,
    excerpt: input.excerpt,
    summary: result.aiSummary,
    body: input.body,
    metaDescription: result.metaDescription,
    focusKeyword: result.focusKeyword,
    categoryId: input.categoryId,
    coverAltText: result.imageAltText,
    internalLinks: internalLinkSuggestions.map((entry) => ({
      label: entry.label,
      url: entry.url,
    })),
    faqItems: result.faqItems,
    seoTitle: result.seoTitle,
    relatedPostIds: [],
    hasCover: Boolean(input.coverUrl),
  });

  const titleHaystack = `${result.seoTitle} ${result.aiSummary}`.toLowerCase();
  const warnings = [...result.warnings];

  if (!titleHaystack.includes(result.focusKeyword.toLowerCase())) {
    warnings.push("Fokus-Keyword sollte im SEO-Titel oder in der KI-Zusammenfassung vorkommen.");
  }

  if (estimateKeywordDensity(input.body, result.focusKeyword) > 3) {
    warnings.push("Keyword-Dichte im Text wirkt hoch — bitte natürlich formulieren.");
  }

  return {
    ...result,
    seoTitle: truncateSeoTitle(result.seoTitle),
    metaDescription: clampMetaDescription(result.metaDescription),
    ogTitle: truncateSeoTitle(result.ogTitle),
    ogDescription: clampMetaDescription(result.ogDescription),
    twitterTitle: truncateSeoTitle(result.twitterTitle),
    twitterDescription: clampMetaDescription(result.twitterDescription),
    internalLinkSuggestions,
    schemaJson,
    seoScore: quality.seoScore,
    readabilityScore:
      result.readabilityScore > 0
        ? result.readabilityScore
        : computeReadabilityScore(input.body),
    warnings,
    readabilityLevel: assessReadability(input.body),
  };
}

export async function analyzeBlogSeoContent(
  input: BlogSeoAnalysisInput,
  linkCandidates: { title: string; url: string; keywords: string[] }[] = [],
): Promise<BlogSeoAnalysisResult> {
  const aiResult = await callOpenAiAnalysis(input);

  const base =
    aiResult ?? buildFallbackSeoAnalysis(input, linkCandidates);

  return enrichSeoAnalysisResult(base, input, linkCandidates);
}

export function isValidSchemaJson(value: unknown): boolean {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}
