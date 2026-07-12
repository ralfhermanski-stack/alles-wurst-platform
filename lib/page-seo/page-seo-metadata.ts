/**
 * @file page-seo-metadata.ts
 * @purpose Next.js Metadata aus gespeicherten SEO-Daten.
 */

import type { Metadata } from "next";

import { buildAbsolutePageUrl } from "./page-seo-site";
import { getPageSeoByRouteKey } from "./page-seo-service";
import { isValidPageJsonLd } from "./page-seo-jsonld";

function resolveImageUrl(image: string | null | undefined): string | undefined {
  if (!image?.trim()) {
    return undefined;
  }

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return buildAbsolutePageUrl(image);
}

export async function resolvePageMetadata(
  routeKey: string,
  fallback: Metadata,
): Promise<Metadata> {
  try {
    const seo = await getPageSeoByRouteKey(routeKey);

    if (!seo?.metaTitle || !seo.metaDescription) {
      return fallback;
    }

    const title = seo.metaTitle;
    const description = seo.metaDescription;
    const canonical = seo.canonicalUrl ?? buildAbsolutePageUrl(seo.path);
    const ogTitle = seo.ogTitle ?? title;
    const ogDescription = seo.ogDescription ?? description;
    const twitterTitle = seo.twitterTitle ?? title;
    const twitterDescription = seo.twitterDescription ?? description;
    const image = resolveImageUrl(seo.ogImage);

    return {
      title,
      description,
      keywords: seo.keywords.length > 0 ? seo.keywords : undefined,
      alternates: {
        canonical,
      },
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        url: canonical,
        type: "website",
        locale: "de_DE",
        siteName: "Alles-Wurst",
        images: image ? [{ url: image, alt: title }] : undefined,
      },
      twitter: {
        card: image ? "summary_large_image" : "summary",
        title: twitterTitle,
        description: twitterDescription,
        images: image ? [image] : undefined,
      },
    };
  } catch (error) {
    console.warn("[page-seo] Metadata-Fallback für", routeKey, error);
    return fallback;
  }
}

export function buildPageJsonLdScript(jsonLd: Record<string, unknown> | null): string | null {
  if (!jsonLd || !isValidPageJsonLd(jsonLd)) {
    return null;
  }

  return JSON.stringify(jsonLd);
}
