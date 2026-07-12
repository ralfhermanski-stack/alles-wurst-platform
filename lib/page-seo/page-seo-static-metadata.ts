import type { Metadata } from "next";

import { resolvePageMetadata } from "./page-seo-metadata";
import { staticRouteKey } from "./page-seo-site";

export function buildStaticPageMetadata(path: string, fallback: Metadata): Promise<Metadata> {
  return resolvePageMetadata(staticRouteKey(path), fallback);
}
