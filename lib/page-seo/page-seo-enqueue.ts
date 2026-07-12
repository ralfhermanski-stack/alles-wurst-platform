/**
 * @file page-seo-enqueue.ts
 * @purpose Hooks bei Inhaltsänderungen.
 */

import { buildRouteKey } from "./page-seo-site";
import { requestPageSeoRefresh } from "./page-seo-queue-service";

export async function notifyCoursePageSeoChange(
  slug: string,
  status: string,
): Promise<void> {
  if (status !== "published") {
    return;
  }

  await requestPageSeoRefresh(buildRouteKey("course", slug), "content_change");
}

export async function notifyProductPageSeoChange(slug: string): Promise<void> {
  await requestPageSeoRefresh(buildRouteKey("product", slug), "content_change");
}

export async function notifyCourseGroupPageSeoChange(slug: string): Promise<void> {
  await requestPageSeoRefresh(buildRouteKey("course_group", slug), "content_change");
}

export async function notifyCourseSubgroupPageSeoChange(
  groupSlug: string,
  subgroupSlug: string,
): Promise<void> {
  await requestPageSeoRefresh(
    buildRouteKey("course_subgroup", `${groupSlug}/${subgroupSlug}`),
    "content_change",
  );
}
