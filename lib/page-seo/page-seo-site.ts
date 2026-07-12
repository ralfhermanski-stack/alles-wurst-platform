/**
 * @file page-seo-site.ts
 * @purpose Site-URL-Hilfen für Page-SEO.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alles-wurst.de";

export function getPageSeoSiteUrl(): string {
  return SITE_URL.replace(/\/+$/, "");
}

export function buildAbsolutePageUrl(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${getPageSeoSiteUrl()}${normalized}`;
}

export function buildRouteKey(
  pageType: string,
  identifier: string,
): string {
  return `${pageType}:${identifier}`;
}

export function staticRouteKey(path: string): string {
  const normalized = path === "/" ? "/" : path.replace(/\/+$/, "");
  return buildRouteKey("static", normalized);
}
