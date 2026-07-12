/**
 * @file blog-seo.ts
 * @purpose SEO-, Qualitäts- und Structured-Data-Hilfen für Blogartikel.
 */

import type { BlogPostDetail, BlogQualityIssue, BlogQualityReport } from "./blog-types";
import {
  BLOG_MIN_WORD_COUNT,
  BLOG_STALE_MONTHS,
  type BlogFaqItem,
} from "./blog-types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alles-wurst.de";
const ORG_NAME = "Alles-Wurst";

export function getBlogSiteUrl(): string {
  return SITE_URL.replace(/\/+$/, "");
}

export function getBlogPostUrl(slug: string): string {
  return `${getBlogSiteUrl()}/magazin/${slug}`;
}

export function calculateReadingTimeMinutes(body: string): number {
  const words = body
    .replace(/[#*_`>\-\[\]()!]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;

  return Math.max(1, Math.ceil(words / 200));
}

export function countWords(text: string): number {
  return text
    .replace(/[#*_`>\-\[\]()!]/g, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}

export function countHeadings(body: string): { h1: number; h2: number; h3: number } {
  const lines = body.split("\n");
  let h1 = 0;
  let h2 = 0;
  let h3 = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("# ")) h1 += 1;
    else if (trimmed.startsWith("## ")) h2 += 1;
    else if (trimmed.startsWith("### ")) h3 += 1;
  }

  return { h1, h2, h3 };
}

export function estimateKeywordDensity(body: string, keyword: string): number {
  if (!keyword.trim()) {
    return 0;
  }

  const words = countWords(body);
  if (words === 0) {
    return 0;
  }

  const pattern = new RegExp(
    keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "gi",
  );
  const matches = body.match(pattern)?.length ?? 0;

  return (matches / words) * 100;
}

export function assessReadability(body: string): "beginner" | "intermediate" | "advanced" {
  const words = countWords(body);
  const sentences = body.split(/[.!?]+/).filter((part) => part.trim()).length || 1;
  const avgWordsPerSentence = words / sentences;

  if (avgWordsPerSentence <= 16) {
    return "beginner";
  }

  if (avgWordsPerSentence <= 24) {
    return "intermediate";
  }

  return "advanced";
}

export function extractTableOfContents(body: string): { id: string; label: string; level: 2 | 3 }[] {
  const items: { id: string; label: string; level: 2 | 3 }[] = [];

  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    let level: 2 | 3 | null = null;
    let label = "";

    if (trimmed.startsWith("## ")) {
      level = 2;
      label = trimmed.slice(3).trim();
    } else if (trimmed.startsWith("### ")) {
      level = 3;
      label = trimmed.slice(4).trim();
    }

    if (!level || !label) {
      continue;
    }

    const id = slugifyHeading(label);

    items.push({ id, label, level });
  }

  return items;
}

function slugifyHeading(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function runBlogQualityCheck(
  post: Pick<
    BlogPostDetail,
    | "title"
    | "slug"
    | "excerpt"
    | "summary"
    | "body"
    | "metaDescription"
    | "focusKeyword"
    | "categoryId"
    | "coverAltText"
    | "internalLinks"
    | "faqItems"
    | "seoTitle"
    | "relatedPostIds"
  > & { hasCover: boolean },
  options?: { duplicateTitles?: string[] },
): BlogQualityReport {
  const issues: BlogQualityIssue[] = [];

  if (!post.title.trim()) {
    issues.push({ code: "title_missing", severity: "error", message: "Titel fehlt." });
  }

  if (!post.slug.trim()) {
    issues.push({ code: "slug_missing", severity: "error", message: "URL-Slug fehlt." });
  }

  if (!post.metaDescription?.trim()) {
    issues.push({
      code: "meta_missing",
      severity: "error",
      message: "Meta-Beschreibung fehlt.",
    });
  } else if (post.metaDescription.length < 70) {
    issues.push({
      code: "meta_short",
      severity: "warning",
      message: "Meta-Beschreibung ist sehr kurz (unter 70 Zeichen).",
    });
  } else if (post.metaDescription.length > 160) {
    issues.push({
      code: "meta_long",
      severity: "warning",
      message: "Meta-Beschreibung ist lang (über 160 Zeichen).",
    });
  }

  const seoTitle = post.seoTitle?.trim() || post.title.trim();

  if (seoTitle.length > 60) {
    issues.push({
      code: "seo_title_long",
      severity: "warning",
      message: "SEO-Titel ist länger als 60 Zeichen.",
    });
  }

  if (!post.hasCover) {
    issues.push({
      code: "cover_missing",
      severity: "error",
      message: "Beitragsbild fehlt.",
    });
  }

  if (!post.coverAltText?.trim()) {
    issues.push({
      code: "alt_missing",
      severity: "error",
      message: "Alt-Text für das Beitragsbild fehlt.",
    });
  }

  if (!post.categoryId) {
    issues.push({
      code: "category_missing",
      severity: "error",
      message: "Kategorie ist nicht gesetzt.",
    });
  }

  if (!post.focusKeyword?.trim()) {
    issues.push({
      code: "focus_keyword_missing",
      severity: "error",
      message: "Fokus-Keyword fehlt.",
    });
  }

  const wordCount = countWords(post.body);

  if (wordCount < BLOG_MIN_WORD_COUNT) {
    issues.push({
      code: "too_short",
      severity: "error",
      message: `Artikel ist zu kurz (mindestens ${BLOG_MIN_WORD_COUNT} Wörter empfohlen).`,
    });
  }

  const headings = countHeadings(post.body);

  if (headings.h1 > 0) {
    issues.push({
      code: "h1_in_body",
      severity: "warning",
      message: "Im Text sollte keine H1 stehen — der Seitentitel ist bereits die H1.",
    });
  }

  if (headings.h2 < 2) {
    issues.push({
      code: "headings_sparse",
      severity: "warning",
      message: "Mindestens zwei Zwischenüberschriften (H2) werden empfohlen.",
    });
  }

  if (post.internalLinks.length < 1) {
    issues.push({
      code: "internal_links_missing",
      severity: "error",
      message: "Mindestens eine interne Verlinkung ist erforderlich.",
    });
  }

  if (post.faqItems.length === 0) {
    issues.push({
      code: "faq_recommended",
      severity: "info",
      message: "FAQ-Bereich wird für KI-Suchmaschinen empfohlen.",
    });
  }

  if (!post.summary?.trim()) {
    issues.push({
      code: "summary_missing",
      severity: "warning",
      message: "Kurz-Zusammenfassung am Artikelanfang fehlt.",
    });
  }

  if (post.body.includes("<!--") || /display:\s*none/i.test(post.body)) {
    issues.push({
      code: "hidden_content",
      severity: "error",
      message: "Versteckte Inhalte sind nicht erlaubt.",
    });
  }

  if (post.focusKeyword) {
    const density = estimateKeywordDensity(post.body, post.focusKeyword);

    if (density > 3) {
      issues.push({
        code: "keyword_density_high",
        severity: "warning",
        message: "Fokus-Keyword könnte zu häufig vorkommen — bitte natürlich formulieren.",
      });
    } else if (density < 0.2 && wordCount > 100) {
      issues.push({
        code: "keyword_density_low",
        severity: "info",
        message: "Fokus-Keyword kommt im Text kaum vor.",
      });
    }
  }

  if (options?.duplicateTitles?.length) {
    issues.push({
      code: "duplicate_title",
      severity: "warning",
      message: `Ähnliche Titel gefunden: ${options.duplicateTitles.slice(0, 2).join(", ")}`,
    });
  }

  const canPublish = issues.filter((issue) => issue.severity === "error").length === 0;

  const seoScore = Math.max(
    0,
    100 -
      issues.filter((issue) => issue.severity === "error").length * 15 -
      issues.filter((issue) => issue.severity === "warning").length * 5,
  );

  return {
    canPublish,
    issues,
    seoScore,
    readabilityLevel: assessReadability(post.body),
  };
}

export function isBlogPostStale(publishedAt: string | null, contentUpdatedAt: string | null): boolean {
  const reference = contentUpdatedAt ?? publishedAt;

  if (!reference) {
    return false;
  }

  const date = new Date(reference);
  const threshold = new Date();
  threshold.setMonth(threshold.getMonth() - BLOG_STALE_MONTHS);

  return date < threshold;
}

export function buildBlogPostingJsonLd(post: BlogPostDetail): Record<string, unknown> {
  const url = post.canonicalUrl?.trim() || getBlogPostUrl(post.slug);
  const graph: Record<string, unknown>[] = [
    {
      "@type": "Organization",
      "@id": `${getBlogSiteUrl()}/#organization`,
      name: ORG_NAME,
      url: getBlogSiteUrl(),
    },
    {
      "@type": "Person",
      "@id": `${getBlogSiteUrl()}/#author-${post.authorUserId}`,
      name: post.authorDisplayName,
    },
    {
      "@type": "BlogPosting",
      "@id": `${url}#article`,
      headline: post.title,
      description: post.metaDescription ?? post.excerpt ?? post.summary,
      image: post.coverUrl
        ? [
            post.coverUrl.startsWith("http")
              ? post.coverUrl
              : `${getBlogSiteUrl()}${post.coverUrl}`,
          ]
        : [`${getBlogSiteUrl()}/images/magazin-cover-fallback.svg`],
      datePublished: post.publishedAt,
      dateModified: post.contentUpdatedAt ?? post.updatedAt,
      author: {
        "@type": "Person",
        name: post.authorDisplayName,
      },
      publisher: {
        "@type": "Organization",
        name: ORG_NAME,
        url: getBlogSiteUrl(),
      },
      mainEntityOfPage: url,
      keywords: [post.focusKeyword, ...post.tagNames].filter(Boolean).join(", "),
      wordCount: countWords(post.body),
      timeRequired: `PT${post.readingTimeMinutes}M`,
      inLanguage: "de-DE",
      articleSection: post.categoryName ?? undefined,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Startseite",
          item: getBlogSiteUrl(),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Magazin",
          item: `${getBlogSiteUrl()}/magazin`,
        },
        ...(post.categoryName
          ? [
              {
                "@type": "ListItem",
                position: 3,
                name: post.categoryName,
                item: `${getBlogSiteUrl()}/magazin/kategorie/${post.categorySlug}`,
              },
            ]
          : []),
        {
          "@type": "ListItem",
          position: post.categoryName ? 4 : 3,
          name: post.title,
          item: url,
        },
      ],
    },
  ];

  if (post.faqItems.length > 0) {
    graph.push(buildFaqJsonLd(post.faqItems));
  }

  return {
    "@context": "https://schema.org",
    "@graph": graph,
  };
}

export function buildFaqJsonLd(faqItems: BlogFaqItem[]): Record<string, unknown> {
  return {
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildBlogMetadata(post: BlogPostDetail) {
  const title = post.seoTitle?.trim() || post.title;
  const description = post.metaDescription?.trim() || post.excerpt?.trim() || post.summary?.trim() || "";
  const ogTitle = post.ogTitle?.trim() || title;
  const ogDescription = post.ogDescription?.trim() || description;
  const twitterTitle = post.twitterTitle?.trim() || ogTitle;
  const twitterDescription = post.twitterDescription?.trim() || ogDescription;
  const url = post.canonicalUrl?.trim() || getBlogPostUrl(post.slug);
  const image = post.coverUrl
    ? post.coverUrl.startsWith("http")
      ? post.coverUrl
      : `${getBlogSiteUrl()}${post.coverUrl}`
    : `${getBlogSiteUrl()}/images/magazin-cover-fallback.svg`;

  const robots = {
    index: post.robotsIndex,
    follow: post.robotsFollow,
  };

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    robots,
    openGraph: {
      type: "article",
      locale: "de_DE",
      url,
      title: ogTitle,
      description: ogDescription,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.contentUpdatedAt ?? post.updatedAt,
      authors: [post.authorDisplayName],
      section: post.categoryName ?? undefined,
      tags: post.tagNames,
      images: image ? [{ url: image, alt: post.coverAltText ?? post.title }] : undefined,
    },
    twitter: {
      card: "summary_large_image" as const,
      title: twitterTitle,
      description: twitterDescription,
      images: image ? [image] : undefined,
    },
  };
}

export function suggestInternalLinks(
  body: string,
  candidates: { title: string; url: string; keywords: string[] }[],
): { label: string; url: string; reason: string }[] {
  const lowerBody = body.toLowerCase();
  const suggestions: { label: string; url: string; reason: string }[] = [];

  for (const candidate of candidates) {
    const matched = candidate.keywords.some((keyword) =>
      lowerBody.includes(keyword.toLowerCase()),
    );

    if (matched) {
      suggestions.push({
        label: candidate.title,
        url: candidate.url,
        reason: "Thematisch passend zum Artikelinhalt",
      });
    }
  }

  return suggestions.slice(0, 8);
}
