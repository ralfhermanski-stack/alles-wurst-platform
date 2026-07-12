/**
 * @file page-seo-discovery.ts
 * @purpose Öffentliche Seiten für SEO erkennen und Inhalte laden.
 */

import { prisma } from "@/lib/db/prisma";

import { isPageSeoExcludedPath } from "./page-seo-exclusions";
import { computePageContentHash } from "./page-seo-hash";
import {
  getStaticPageContent,
  listStaticPageDefinitions,
  staticPageToContent,
} from "./page-seo-static-registry";
import { buildRouteKey } from "./page-seo-site";
import type { PageSeoContentInput } from "./page-seo-types";

export type DiscoveredPage = PageSeoContentInput & {
  contentHash: string;
};

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function loadPageContent(routeKey: string): Promise<PageSeoContentInput | null> {
  if (routeKey.startsWith("static:")) {
    const path = routeKey.slice("static:".length);
    return getStaticPageContent(path === "" ? "/" : path);
  }

  if (routeKey.startsWith("course:")) {
    const slug = routeKey.slice("course:".length);
    const course = await prisma.course.findFirst({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        subtitle: true,
        shortDescription: true,
        description: true,
        learningGoals: true,
        status: true,
        coverStorageKey: true,
      },
    });

    if (!course) {
      return null;
    }

    const bodyParts = [
      course.subtitle,
      course.shortDescription,
      course.description,
      course.learningGoals,
    ].filter((part): part is string => Boolean(part?.trim()));

    return {
      routeKey,
      path: `/akademie/kurse/${course.slug}`,
      pageType: "course",
      entityId: course.id,
      isPublished: course.status === "published",
      title: course.title,
      heroText: course.subtitle,
      description: course.shortDescription,
      headings: [],
      bodyText: stripHtml(bodyParts.join("\n\n")),
      imageUrl: course.coverStorageKey ? `/api/courses/covers/${course.id}` : null,
      imageAlt: course.title,
      isLegalPage: false,
    };
  }

  if (routeKey.startsWith("product:")) {
    const slug = routeKey.slice("product:".length);
    const product = await prisma.product.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        active: true,
      },
    });

    if (!product) {
      return null;
    }

    return {
      routeKey,
      path: `/kaufen/${product.slug}`,
      pageType: "product",
      entityId: product.id,
      isPublished: product.active,
      title: product.name,
      heroText: product.description?.slice(0, 200) ?? null,
      description: product.description,
      headings: [],
      bodyText: stripHtml(product.description ?? ""),
      imageUrl: null,
      imageAlt: null,
      isLegalPage: false,
    };
  }

  if (routeKey.startsWith("course_group:")) {
    const slug = routeKey.slice("course_group:".length);
    const group = await prisma.courseGroup.findFirst({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        shortDescription: true,
        isActive: true,
      },
    });

    if (!group) {
      return null;
    }

    return {
      routeKey,
      path: `/akademie/kurse/gruppen/${group.slug}`,
      pageType: "course_group",
      entityId: group.id,
      isPublished: group.isActive,
      title: group.name,
      heroText: group.shortDescription,
      description: group.shortDescription,
      headings: [],
      bodyText: stripHtml(group.shortDescription ?? group.name),
      imageUrl: null,
      imageAlt: null,
      isLegalPage: false,
    };
  }

  if (routeKey.startsWith("course_subgroup:")) {
    const composite = routeKey.slice("course_subgroup:".length);
    const [groupSlug, subgroupSlug] = composite.split("/");

    if (!groupSlug || !subgroupSlug) {
      return null;
    }

    const subgroup = await prisma.courseSubgroup.findFirst({
      where: {
        slug: subgroupSlug,
        courseGroup: { slug: groupSlug },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        shortDescription: true,
        isActive: true,
        courseGroup: { select: { slug: true } },
      },
    });

    if (!subgroup) {
      return null;
    }

    return {
      routeKey,
      path: `/akademie/kurse/gruppen/${subgroup.courseGroup.slug}/${subgroup.slug}`,
      pageType: "course_subgroup",
      entityId: subgroup.id,
      isPublished: subgroup.isActive,
      title: subgroup.name,
      heroText: subgroup.shortDescription,
      description: subgroup.shortDescription,
      headings: [],
      bodyText: stripHtml(subgroup.shortDescription ?? subgroup.name),
      imageUrl: null,
      imageAlt: null,
      isLegalPage: false,
    };
  }

  if (routeKey.startsWith("blog_category:")) {
    const slug = routeKey.slice("blog_category:".length);
    const category = await prisma.blogCategory.findFirst({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
      },
    });

    if (!category) {
      return null;
    }

    return {
      routeKey,
      path: `/magazin/kategorie/${category.slug}`,
      pageType: "blog_category",
      entityId: category.id,
      isPublished: true,
      title: category.name,
      heroText: category.description,
      description: category.description,
      headings: [],
      bodyText: stripHtml(category.description ?? category.name),
      imageUrl: null,
      imageAlt: null,
      isLegalPage: false,
    };
  }

  if (routeKey.startsWith("blog_tag:")) {
    const slug = routeKey.slice("blog_tag:".length);
    const tag = await prisma.blogTag.findFirst({
      where: { slug },
      select: {
        id: true,
        slug: true,
        name: true,
      },
    });

    if (!tag) {
      return null;
    }

    return {
      routeKey,
      path: `/magazin/schlagwort/${tag.slug}`,
      pageType: "blog_tag",
      entityId: tag.id,
      isPublished: true,
      title: tag.name,
      heroText: `Artikel zum Schlagwort ${tag.name}`,
      description: `Magazin-Artikel zum Thema ${tag.name}.`,
      headings: [],
      bodyText: `Schlagwortseite für ${tag.name} im Alles-Wurst Magazin.`,
      imageUrl: null,
      imageAlt: null,
      isLegalPage: false,
    };
  }

  return null;
}

export async function discoverPublicPages(
  onlyPublished = true,
): Promise<DiscoveredPage[]> {
  const pages: PageSeoContentInput[] = listStaticPageDefinitions().map(staticPageToContent);

  const [courses, products, groups, subgroups, categories, tags] = await Promise.all([
    prisma.course.findMany({
      where: onlyPublished ? { status: "published" } : undefined,
      select: { id: true, slug: true, status: true },
    }),
    prisma.product.findMany({
      where: onlyPublished ? { active: true } : undefined,
      select: { id: true, slug: true, active: true },
    }),
    prisma.courseGroup.findMany({
      where: onlyPublished ? { isActive: true } : undefined,
      select: { id: true, slug: true, isActive: true },
    }),
    prisma.courseSubgroup.findMany({
      where: onlyPublished ? { isActive: true } : undefined,
      select: {
        id: true,
        slug: true,
        isActive: true,
        courseGroup: { select: { slug: true } },
      },
    }),
    prisma.blogCategory.findMany({ select: { id: true, slug: true } }),
    prisma.blogTag.findMany({ select: { id: true, slug: true } }),
  ]);

  for (const course of courses) {
    const routeKey = buildRouteKey("course", course.slug);
    const content = await loadPageContent(routeKey);

    if (content) {
      pages.push(content);
    }
  }

  for (const product of products) {
    const routeKey = buildRouteKey("product", product.slug);
    const content = await loadPageContent(routeKey);

    if (content) {
      pages.push(content);
    }
  }

  for (const group of groups) {
    const routeKey = buildRouteKey("course_group", group.slug);
    const content = await loadPageContent(routeKey);

    if (content) {
      pages.push(content);
    }
  }

  for (const subgroup of subgroups) {
    const routeKey = buildRouteKey(
      "course_subgroup",
      `${subgroup.courseGroup.slug}/${subgroup.slug}`,
    );
    const content = await loadPageContent(routeKey);

    if (content) {
      pages.push(content);
    }
  }

  for (const category of categories) {
    const routeKey = buildRouteKey("blog_category", category.slug);
    const content = await loadPageContent(routeKey);

    if (content) {
      pages.push(content);
    }
  }

  for (const tag of tags) {
    const routeKey = buildRouteKey("blog_tag", tag.slug);
    const content = await loadPageContent(routeKey);

    if (content) {
      pages.push(content);
    }
  }

  return pages
    .filter((page) => !isPageSeoExcludedPath(page.path))
    .map((page) => ({
      ...page,
      contentHash: computePageContentHash(page),
    }));
}
