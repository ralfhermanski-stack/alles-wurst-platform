/**
 * @file page-seo-ai-service.ts
 * @purpose KI- und Fallback-SEO für öffentliche Seiten.
 */

import {
  clampMetaDescription,
  extractFrequentKeywords,
  truncateSeoTitle,
} from "@/lib/blog/blog-seo-text-utils";

import { buildAbsolutePageUrl } from "./page-seo-site";
import { buildPageJsonLd } from "./page-seo-jsonld";
import type { PageSeoContentInput, PageSeoGenerationResult } from "./page-seo-types";
import { parseStringArray } from "./page-seo-types";

const SYSTEM_PROMPT = `Du bist ein SEO-Assistent für alles-wurst.de (Wurst selber machen, Fleischverarbeitung, Kurse, Räuchern, Marinaden).
Antworte NUR mit validem JSON auf Deutsch.
Erfinde KEINE Fakten. Nutze ausschließlich den gelieferten Seiteninhalt.
Bei rechtlichen Seiten formuliere neutral und vorsichtig, ohne neue Rechtsaussagen.
Meta Description 140–160 Zeichen. Meta Title max. 60 Zeichen.
Kein Keyword-Stuffing. Ton: fachlich, vertrauenswürdig, verständlich.`;

type RawAiResponse = {
  metaTitle?: unknown;
  metaDescription?: unknown;
  keywords?: unknown;
  ogTitle?: unknown;
  ogDescription?: unknown;
  ogImage?: unknown;
  twitterTitle?: unknown;
  twitterDescription?: unknown;
  aiSummary?: unknown;
  aiMainTopic?: unknown;
  aiEntities?: unknown;
  aiAudience?: unknown;
  aiExpertise?: unknown;
  semanticKeywords?: unknown;
  warnings?: unknown;
};

export function validatePageSeoAiResponse(
  raw: unknown,
  input: PageSeoContentInput,
): PageSeoGenerationResult | null {
  if (typeof raw !== "object" || raw === null) {
    return null;
  }

  const data = raw as RawAiResponse;
  const metaTitle =
    typeof data.metaTitle === "string" ? truncateSeoTitle(data.metaTitle) : "";
  const metaDescription =
    typeof data.metaDescription === "string"
      ? clampMetaDescription(data.metaDescription)
      : "";

  if (!metaTitle || !metaDescription) {
    return null;
  }

  const keywords = parseStringArray(data.keywords).slice(0, 12);
  const ogTitle = truncateSeoTitle(
    typeof data.ogTitle === "string" ? data.ogTitle : metaTitle,
  );
  const ogDescription = clampMetaDescription(
    typeof data.ogDescription === "string" ? data.ogDescription : metaDescription,
  );
  const twitterTitle = truncateSeoTitle(
    typeof data.twitterTitle === "string" ? data.twitterTitle : metaTitle,
  );
  const twitterDescription = clampMetaDescription(
    typeof data.twitterDescription === "string"
      ? data.twitterDescription
      : metaDescription,
  );

  const canonicalUrl = buildAbsolutePageUrl(input.path);
  const ogImage =
    typeof data.ogImage === "string" && data.ogImage.trim()
      ? data.ogImage.trim()
      : input.imageUrl;

  const partial = {
    metaTitle,
    metaDescription,
    keywords,
    ogTitle,
    ogDescription,
    ogImage,
    twitterTitle,
    twitterDescription,
    canonicalUrl,
    aiSummary:
      typeof data.aiSummary === "string" ? data.aiSummary.trim() : metaDescription,
    aiMainTopic:
      typeof data.aiMainTopic === "string" ? data.aiMainTopic.trim() : input.title,
    aiEntities: parseStringArray(data.aiEntities).slice(0, 12),
    aiAudience:
      typeof data.aiAudience === "string"
        ? data.aiAudience.trim()
        : "Interessierte an Wurstherstellung und Fleischverarbeitung",
    aiExpertise:
      typeof data.aiExpertise === "string"
        ? data.aiExpertise.trim()
        : "Fleischverarbeitung und Wurstherstellung",
    semanticKeywords: parseStringArray(data.semanticKeywords).slice(0, 12),
    source: "ai" as const,
    warnings: parseStringArray(data.warnings),
  };

  return {
    ...partial,
    jsonLd: buildPageJsonLd(input, partial),
  };
}

function buildPrompt(input: PageSeoContentInput): string {
  return JSON.stringify(
    {
      instruction:
        "Analysiere die öffentliche Seite und gib JSON zurück mit: metaTitle, metaDescription, keywords, ogTitle, ogDescription, ogImage (optional), twitterTitle, twitterDescription, aiSummary, aiMainTopic, aiEntities, aiAudience, aiExpertise, semanticKeywords, warnings",
      pageType: input.pageType,
      path: input.path,
      title: input.title,
      heroText: input.heroText,
      description: input.description,
      headings: input.headings,
      bodyText: input.bodyText.slice(0, 12000),
      imageAlt: input.imageAlt,
      isLegalPage: input.isLegalPage,
    },
    null,
    2,
  );
}

async function callOpenAiPageSeo(
  input: PageSeoContentInput,
): Promise<PageSeoGenerationResult | null> {
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
      console.warn("[page-seo-ai] OpenAI Fehler:", response.status);
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
    return validatePageSeoAiResponse(parsed, input);
  } catch (error) {
    console.warn("[page-seo-ai] OpenAI-Aufruf fehlgeschlagen:", error);
    return null;
  }
}

export function buildFallbackPageSeo(input: PageSeoContentInput): PageSeoGenerationResult {
  const baseText = [input.title, input.heroText, input.description, input.bodyText]
    .filter(Boolean)
    .join("\n\n");

  const metaTitle = truncateSeoTitle(input.title);
  const metaDescription = clampMetaDescription(
    input.description?.trim() || input.heroText?.trim() || input.bodyText.slice(0, 200),
  );
  const keywords = extractFrequentKeywords(baseText, 8);
  const canonicalUrl = buildAbsolutePageUrl(input.path);

  const partial = {
    metaTitle,
    metaDescription,
    keywords,
    ogTitle: metaTitle,
    ogDescription: metaDescription,
    ogImage: input.imageUrl,
    twitterTitle: metaTitle,
    twitterDescription: metaDescription,
    canonicalUrl,
    aiSummary: metaDescription,
    aiMainTopic: input.title,
    aiEntities: keywords.slice(0, 6),
    aiAudience: "Interessierte an Wurstherstellung und Fleischverarbeitung",
    aiExpertise: "Fleischverarbeitung, Wurstherstellung und Räuchern",
    semanticKeywords: keywords,
    source: "fallback" as const,
    warnings: input.isLegalPage
      ? ["Rechtliche Seite – bitte manuell prüfen."]
      : [],
  };

  return {
    ...partial,
    jsonLd: buildPageJsonLd(input, partial),
  };
}

export async function generatePageSeoContent(
  input: PageSeoContentInput,
): Promise<PageSeoGenerationResult> {
  const aiResult = await callOpenAiPageSeo(input);

  if (aiResult) {
    return aiResult;
  }

  return buildFallbackPageSeo(input);
}
