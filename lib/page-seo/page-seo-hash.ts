/**
 * @file page-seo-hash.ts
 * @purpose Content-Hash für SEO-Versionsprüfung.
 */

import { createHash } from "node:crypto";

import type { PageSeoContentInput } from "./page-seo-types";

export function computePageContentHash(input: PageSeoContentInput): string {
  const payload = JSON.stringify({
    title: input.title.trim(),
    heroText: input.heroText?.trim() ?? "",
    description: input.description?.trim() ?? "",
    headings: input.headings,
    bodyText: input.bodyText.trim().slice(0, 20000),
    imageUrl: input.imageUrl ?? "",
    imageAlt: input.imageAlt ?? "",
    isPublished: input.isPublished,
  });

  return createHash("sha256").update(payload).digest("hex");
}
