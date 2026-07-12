/**
 * @file page-seo-jsonld.ts
 * @purpose JSON-LD für öffentliche Seiten.
 */

import { buildAbsolutePageUrl } from "./page-seo-site";
import type { PageSeoContentInput, PageSeoGenerationResult } from "./page-seo-types";

const ORG_NAME = "Alles-Wurst";

function organizationNode() {
  return {
    "@type": "Organization",
    "@id": `${buildAbsolutePageUrl("/")}#organization`,
    name: ORG_NAME,
    url: buildAbsolutePageUrl("/"),
  };
}

export function buildPageJsonLd(
  input: PageSeoContentInput,
  result: Pick<
    PageSeoGenerationResult,
    "metaTitle" | "metaDescription" | "canonicalUrl" | "ogImage" | "aiSummary"
  >,
): Record<string, unknown> {
  const pageUrl = result.canonicalUrl || buildAbsolutePageUrl(input.path);
  const image = result.ogImage
    ? result.ogImage.startsWith("http")
      ? result.ogImage
      : buildAbsolutePageUrl(result.ogImage)
    : undefined;

  const webPage = {
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: result.metaTitle,
    description: result.metaDescription,
    isPartOf: { "@id": `${buildAbsolutePageUrl("/")}#website` },
    about: result.aiSummary || undefined,
    inLanguage: "de-DE",
    image,
  };

  const website = {
    "@type": "WebSite",
    "@id": `${buildAbsolutePageUrl("/")}#website`,
    url: buildAbsolutePageUrl("/"),
    name: ORG_NAME,
    publisher: { "@id": `${buildAbsolutePageUrl("/")}#organization` },
    inLanguage: "de-DE",
  };

  if (input.pageType === "course") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        organizationNode(),
        website,
        webPage,
        {
          "@type": "Course",
          "@id": `${pageUrl}#course`,
          name: input.title,
          description: result.metaDescription,
          provider: { "@id": `${buildAbsolutePageUrl("/")}#organization` },
          url: pageUrl,
          image,
        },
      ],
    };
  }

  if (input.pageType === "product") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        organizationNode(),
        website,
        webPage,
        {
          "@type": "Product",
          "@id": `${pageUrl}#product`,
          name: input.title,
          description: result.metaDescription,
          url: pageUrl,
          brand: { "@type": "Brand", name: ORG_NAME },
        },
      ],
    };
  }

  return {
    "@context": "https://schema.org",
    "@graph": [organizationNode(), website, webPage],
  };
}

export function isValidPageJsonLd(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;
  return record["@context"] === "https://schema.org";
}
