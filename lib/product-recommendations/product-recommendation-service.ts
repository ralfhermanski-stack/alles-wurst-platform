/**
 * @file product-recommendation-service.ts
 * @purpose Öffentliche Produktempfehlungen für die Werkstatt.
 */

import type { ProductRecommendationClickType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import {
  CATEGORY_PLACEHOLDER_IMAGES,
  DEFAULT_PRODUCT_RECOMMENDATION_CATEGORIES,
  isDefaultProductRecommendationCategorySlug,
} from "./product-recommendation-categories";
import { getProductImagePublicUrl } from "./product-recommendation-image-storage";
import {
  buildAffiliateUrl,
  buildAmazonUrl,
  ensureDefaultPartnerPrograms,
  getProductRecommendationSettings,
} from "./partner-program-service";
import type {
  ProductRecommendationCategoryEntry,
  ProductRecommendationDetail,
  ProductRecommendationSummary,
} from "./product-recommendation-types";

export async function ensureDefaultProductRecommendationCategories(): Promise<void> {
  for (const category of DEFAULT_PRODUCT_RECOMMENDATION_CATEGORIES) {
    await prisma.productRecommendationCategory.upsert({
      where: { slug: category.slug },
      create: {
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
        isActive: true,
      },
      update: {},
    });
  }
}

function resolveImageUrl(product: {
  id: string;
  mainImageStorageKey: string | null;
  category: { id: string; slug: string; placeholderImageStorageKey: string | null };
}): string | null {
  if (product.mainImageStorageKey) {
    return getProductImagePublicUrl(product.id, "main");
  }

  if (product.category.placeholderImageStorageKey) {
    return `/api/werkstatt/empfehlungen/images/category/${product.category.id}`;
  }

  return CATEGORY_PLACEHOLDER_IMAGES[product.category.slug] ?? CATEGORY_PLACEHOLDER_IMAGES.sonstiges;
}

async function resolveOutboundUrls(product: {
  affiliateLink: string | null;
  amazonLink: string | null;
  shopLink: string | null;
  partnerProgram: {
    affiliateId: string | null;
    urlTemplate: string | null;
    baseUrl: string | null;
  } | null;
}) {
  const settings = await getProductRecommendationSettings();

  return {
    amazonUrl: buildAmazonUrl({
      amazonLink: product.amazonLink,
      partnerProgram: product.partnerProgram,
      settingsAffiliateId: settings.defaultAmazonProgramId
        ? (
            await prisma.partnerProgram.findUnique({
              where: { id: settings.defaultAmazonProgramId },
            })
          )?.affiliateId
        : null,
    }),
    shopUrl: product.shopLink?.trim() || null,
    affiliateUrl: buildAffiliateUrl({
      affiliateLink: product.affiliateLink,
      partnerProgram: product.partnerProgram,
    }),
  };
}

function mapSummary(
  product: {
    id: string;
    slug: string;
    title: string;
    shortDescription: string;
    manufacturer: string | null;
    subcategory: string | null;
    categoryId: string;
    mainImageStorageKey: string | null;
    status: ProductRecommendationSummary["status"];
    sortOrder: number;
    priority: number;
    isMasterRecommendation: boolean;
    affiliateLink: string | null;
    amazonLink: string | null;
    shopLink: string | null;
    viewCount: number;
    publishedAt: Date | null;
    category: { id: string; name: string; slug: string; placeholderImageStorageKey: string | null };
  },
): ProductRecommendationSummary {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    shortDescription: product.shortDescription,
    manufacturer: product.manufacturer,
    subcategory: product.subcategory,
    categoryId: product.categoryId,
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    imageUrl: resolveImageUrl(product),
    status: product.status,
    sortOrder: product.sortOrder,
    priority: product.priority,
    isMasterRecommendation: product.isMasterRecommendation,
    hasAmazonLink: Boolean(product.amazonLink?.trim()),
    hasShopLink: Boolean(product.shopLink?.trim()),
    hasAffiliateLink: Boolean(product.affiliateLink?.trim()),
    viewCount: product.viewCount,
    publishedAt: product.publishedAt?.toISOString() ?? null,
  };
}

export async function listProductRecommendationCategories(): Promise<
  ProductRecommendationCategoryEntry[]
> {
  await ensureDefaultProductRecommendationCategories();

  const categories = await prisma.productRecommendationCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: {
          products: { where: { status: "published" } },
        },
      },
    },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    placeholderImageUrl: category.placeholderImageStorageKey
      ? `/api/werkstatt/empfehlungen/images/category/${category.id}`
      : CATEGORY_PLACEHOLDER_IMAGES[category.slug] ?? null,
    hasCustomPlaceholderImage: Boolean(category.placeholderImageStorageKey),
    productCount: category._count.products,
    isSystemCategory: isDefaultProductRecommendationCategorySlug(category.slug),
  }));
}

export async function listPublishedProductRecommendations(filters?: {
  categorySlug?: string;
  search?: string;
}): Promise<ProductRecommendationSummary[]> {
  await ensureDefaultPartnerPrograms();
  await ensureDefaultProductRecommendationCategories();

  const products = await prisma.productRecommendation.findMany({
    where: {
      status: "published",
      category: { isActive: true },
      ...(filters?.categorySlug
        ? { category: { slug: filters.categorySlug } }
        : {}),
      ...(filters?.search
        ? {
            OR: [
              { title: { contains: filters.search, mode: "insensitive" } },
              { shortDescription: { contains: filters.search, mode: "insensitive" } },
              { manufacturer: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ priority: "desc" }, { sortOrder: "asc" }, { title: "asc" }],
    include: { category: true },
  });

  return products.map(mapSummary);
}

export async function getPublishedProductRecommendationBySlug(
  slug: string,
  options: { recordView?: boolean; userId?: string | null } = {},
): Promise<ProductRecommendationDetail | null> {
  await ensureDefaultPartnerPrograms();

  const product = await prisma.productRecommendation.findFirst({
    where: { slug, status: "published" },
    include: {
      category: true,
      partnerProgram: true,
      galleryImages: { orderBy: { sortOrder: "asc" } },
      courseLinks: true,
      recipeLinks: true,
    },
  });

  if (!product) {
    return null;
  }

  if (options.recordView !== false) {
    await recordProductRecommendationEvent(product.id, "view", options.userId ?? null);
  }

  const urls = await resolveOutboundUrls(product);

  return {
    ...mapSummary(product),
    longDescription: product.longDescription,
    masterRecommendationText: product.masterRecommendationText,
    ...urls,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    ogTitle: product.ogTitle,
    ogDescription: product.ogDescription,
    galleryImageUrls: product.galleryImages.map((image) =>
      getProductImagePublicUrl(product.id, "gallery", image.id),
    ),
    linkedCourseIds: product.courseLinks.map((link) => link.courseId),
    linkedRecipeIds: product.recipeLinks.map((link) => link.recipeId),
  };
}

export async function listProductRecommendationsForCourse(
  courseId: string,
): Promise<ProductRecommendationSummary[]> {
  const links = await prisma.productRecommendationCourseLink.findMany({
    where: { courseId },
    orderBy: { sortOrder: "asc" },
    include: {
      product: {
        include: { category: true },
      },
    },
  });

  return links
    .map((link) => link.product)
    .filter((product) => product.status === "published")
    .map(mapSummary);
}

export async function listProductRecommendationsForRecipe(
  recipeId: string,
): Promise<ProductRecommendationSummary[]> {
  const links = await prisma.productRecommendationRecipeLink.findMany({
    where: { recipeId },
    orderBy: { sortOrder: "asc" },
    include: {
      product: {
        include: { category: true },
      },
    },
  });

  return links
    .map((link) => link.product)
    .filter((product) => product.status === "published")
    .map(mapSummary);
}

export async function recordProductRecommendationEvent(
  productId: string,
  eventType: ProductRecommendationClickType,
  userId: string | null,
): Promise<void> {
  const counterUpdate =
    eventType === "view"
      ? { viewCount: { increment: 1 } }
      : eventType === "amazon"
        ? { amazonClickCount: { increment: 1 } }
        : eventType === "shop"
          ? { shopClickCount: { increment: 1 } }
          : { affiliateClickCount: { increment: 1 } };

  await prisma.$transaction([
    prisma.productRecommendationClickEvent.create({
      data: { productId, eventType, userId },
    }),
    prisma.productRecommendation.update({
      where: { id: productId },
      data: counterUpdate,
    }),
  ]);
}

export async function getAffiliateDisclosureText(): Promise<string> {
  const settings = await getProductRecommendationSettings();
  return settings.affiliateDisclosureText;
}
