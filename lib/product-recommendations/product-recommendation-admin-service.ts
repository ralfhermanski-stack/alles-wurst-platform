/**
 * @file product-recommendation-admin-service.ts
 * @purpose Admin-CRUD für Produktempfehlungen und Kategorien.
 */

import type { ProductRecommendationStatus } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import {
  CATEGORY_PLACEHOLDER_IMAGES,
  DEFAULT_PRODUCT_RECOMMENDATION_CATEGORIES,
  isDefaultProductRecommendationCategorySlug,
} from "./product-recommendation-categories";
import { getCategoryPlaceholderPublicUrl, getProductImagePublicUrl } from "./product-recommendation-image-storage";
import { ensureDefaultPartnerPrograms } from "./partner-program-service";
import {
  ensureDefaultProductRecommendationCategories,
  listProductRecommendationCategories,
} from "./product-recommendation-service";
import type {
  ProductRecommendationAnalytics,
  ProductRecommendationCategoryEntry,
  ProductRecommendationDetail,
  ProductRecommendationSummary,
  UpsertProductRecommendationInput,
} from "./product-recommendation-types";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function clampShortDescription(value: string): string {
  return value.trim().slice(0, 250);
}

function mapAdminSummary(product: {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  manufacturer: string | null;
  subcategory: string | null;
  categoryId: string;
  mainImageStorageKey: string | null;
  status: ProductRecommendationStatus;
  sortOrder: number;
  priority: number;
  isMasterRecommendation: boolean;
  affiliateLink: string | null;
  amazonLink: string | null;
  shopLink: string | null;
  viewCount: number;
  amazonClickCount: number;
  shopClickCount: number;
  affiliateClickCount: number;
  publishedAt: Date | null;
  category: { id: string; name: string; slug: string; placeholderImageStorageKey: string | null };
}): ProductRecommendationSummary & {
  amazonClickCount: number;
  shopClickCount: number;
  affiliateClickCount: number;
} {
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
    imageUrl: product.mainImageStorageKey
      ? getProductImagePublicUrl(product.id, "main")
      : product.category.placeholderImageStorageKey
        ? `/api/werkstatt/empfehlungen/images/category/${product.category.id}`
        : CATEGORY_PLACEHOLDER_IMAGES[product.category.slug] ?? null,
    status: product.status,
    sortOrder: product.sortOrder,
    priority: product.priority,
    isMasterRecommendation: product.isMasterRecommendation,
    hasAmazonLink: Boolean(product.amazonLink?.trim()),
    hasShopLink: Boolean(product.shopLink?.trim()),
    hasAffiliateLink: Boolean(product.affiliateLink?.trim()),
    viewCount: product.viewCount,
    publishedAt: product.publishedAt?.toISOString() ?? null,
    amazonClickCount: product.amazonClickCount,
    shopClickCount: product.shopClickCount,
    affiliateClickCount: product.affiliateClickCount,
  };
}

export async function listAdminProductRecommendations(filters?: {
  status?: ProductRecommendationStatus;
  categoryId?: string;
  search?: string;
}): Promise<Array<ProductRecommendationSummary & {
  amazonClickCount: number;
  shopClickCount: number;
  affiliateClickCount: number;
}>> {
  await ensureDefaultProductRecommendationCategories();

  const products = await prisma.productRecommendation.findMany({
    where: {
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters?.search
        ? {
            OR: [
              { title: { contains: filters.search, mode: "insensitive" } },
              { shortDescription: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ priority: "desc" }, { sortOrder: "asc" }, { title: "asc" }],
    include: { category: true },
  });

  return products.map(mapAdminSummary);
}

export async function getAdminProductRecommendation(
  id: string,
): Promise<(ProductRecommendationDetail & {
  amazonClickCount: number;
  shopClickCount: number;
  affiliateClickCount: number;
  partnerProgramId: string | null;
  affiliateLink: string | null;
  amazonLink: string | null;
  shopLink: string | null;
}) | null> {
  const product = await prisma.productRecommendation.findUnique({
    where: { id },
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

  const summary = mapAdminSummary(product);

  return {
    ...summary,
    longDescription: product.longDescription,
    masterRecommendationText: product.masterRecommendationText,
    amazonUrl: null,
    shopUrl: product.shopLink,
    affiliateUrl: product.affiliateLink,
    seoTitle: product.seoTitle,
    seoDescription: product.seoDescription,
    ogTitle: product.ogTitle,
    ogDescription: product.ogDescription,
    galleryImageUrls: product.galleryImages.map((image) =>
      getProductImagePublicUrl(product.id, "gallery", image.id),
    ),
    linkedCourseIds: product.courseLinks.map((link) => link.courseId),
    linkedRecipeIds: product.recipeLinks.map((link) => link.recipeId),
    partnerProgramId: product.partnerProgramId,
    affiliateLink: product.affiliateLink,
    amazonLink: product.amazonLink,
    shopLink: product.shopLink,
  };
}

async function syncLinks(
  productId: string,
  linkedRecipeIds?: string[],
): Promise<void> {
  if (linkedRecipeIds) {
    await prisma.productRecommendationRecipeLink.deleteMany({ where: { productId } });

    if (linkedRecipeIds.length > 0) {
      await prisma.productRecommendationRecipeLink.createMany({
        data: linkedRecipeIds.map((recipeId, index) => ({
          productId,
          recipeId,
          sortOrder: (index + 1) * 10,
        })),
        skipDuplicates: true,
      });
    }
  }
}

export async function listLinkedProductIdsForCourse(
  courseId: string,
): Promise<string[]> {
  const links = await prisma.productRecommendationCourseLink.findMany({
    where: { courseId },
    orderBy: { sortOrder: "asc" },
    select: { productId: true },
  });

  return links.map((link) => link.productId);
}

export async function syncCourseProductRecommendationLinks(
  courseId: string,
  productIds: string[],
): Promise<UserServiceResult<true>> {
  const uniqueIds = [...new Set(productIds.filter(Boolean))];

  if (uniqueIds.length > 0) {
    const existing = await prisma.productRecommendation.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });

    if (existing.length !== uniqueIds.length) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message: "Mindestens eine Werkstatt-Empfehlung existiert nicht.",
      });
    }
  }

  await prisma.$transaction([
    prisma.productRecommendationCourseLink.deleteMany({ where: { courseId } }),
    ...(uniqueIds.length > 0
      ? [
          prisma.productRecommendationCourseLink.createMany({
            data: uniqueIds.map((productId, index) => ({
              productId,
              courseId,
              sortOrder: (index + 1) * 10,
            })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);

  return userSuccess(true);
}

function buildAutoSeo(input: {
  title: string;
  shortDescription: string;
  categoryName: string;
}) {
  const seoTitle = `${input.title} — Empfehlung | Alles-Wurst Werkstatt`;
  const seoDescription = input.shortDescription.slice(0, 160);

  return {
    seoTitle,
    seoDescription,
    ogTitle: input.title,
    ogDescription: seoDescription,
  };
}

export async function createProductRecommendation(
  input: UpsertProductRecommendationInput,
): Promise<UserServiceResult<ProductRecommendationDetail>> {
  if (!input.title.trim()) {
    return userFailure({ code: "VALIDATION_ERROR", message: "Titel ist erforderlich." });
  }

  if (!input.shortDescription.trim()) {
    return userFailure({ code: "VALIDATION_ERROR", message: "Kurzbeschreibung ist erforderlich." });
  }

  const category = await prisma.productRecommendationCategory.findUnique({
    where: { id: input.categoryId },
  });

  if (!category) {
    return userFailure({ code: "VALIDATION_ERROR", message: "Kategorie nicht gefunden." });
  }

  const slug = slugify(input.slug ?? input.title);
  const autoSeo = buildAutoSeo({
    title: input.title.trim(),
    shortDescription: clampShortDescription(input.shortDescription),
    categoryName: category.name,
  });

  const status = input.status ?? "draft";

  const product = await prisma.productRecommendation.create({
    data: {
      title: input.title.trim(),
      slug,
      shortDescription: clampShortDescription(input.shortDescription),
      longDescription: input.longDescription ?? null,
      manufacturer: input.manufacturer ?? null,
      subcategory: input.subcategory ?? null,
      categoryId: input.categoryId,
      sortOrder: input.sortOrder ?? 100,
      priority: input.priority ?? 0,
      status,
      affiliateLink: input.affiliateLink ?? null,
      amazonLink: input.amazonLink ?? null,
      shopLink: input.shopLink ?? null,
      partnerProgramId: input.partnerProgramId ?? null,
      isMasterRecommendation: input.isMasterRecommendation ?? false,
      masterRecommendationText: input.masterRecommendationText ?? null,
      seoTitle: input.seoTitle ?? autoSeo.seoTitle,
      seoDescription: input.seoDescription ?? autoSeo.seoDescription,
      ogTitle: input.ogTitle ?? autoSeo.ogTitle,
      ogDescription: input.ogDescription ?? autoSeo.ogDescription,
      publishedAt: status === "published" ? new Date() : null,
      archivedAt: status === "archived" ? new Date() : null,
    },
  });

  await syncLinks(product.id, input.linkedRecipeIds);

  const detail = await getAdminProductRecommendation(product.id);

  if (!detail) {
    return userFailure({ code: "INTERNAL_ERROR", message: "Produkt konnte nicht geladen werden." });
  }

  return userSuccess(detail);
}

export async function updateProductRecommendation(
  id: string,
  input: UpsertProductRecommendationInput,
): Promise<UserServiceResult<ProductRecommendationDetail>> {
  const existing = await prisma.productRecommendation.findUnique({ where: { id } });

  if (!existing) {
    return userFailure({ code: "NOT_FOUND", message: "Produkt nicht gefunden." });
  }

  const category = await prisma.productRecommendationCategory.findUnique({
    where: { id: input.categoryId },
  });

  if (!category) {
    return userFailure({ code: "VALIDATION_ERROR", message: "Kategorie nicht gefunden." });
  }

  const status = input.status ?? existing.status;

  await prisma.productRecommendation.update({
    where: { id },
    data: {
      title: input.title.trim(),
      slug: input.slug ? slugify(input.slug) : existing.slug,
      shortDescription: clampShortDescription(input.shortDescription),
      longDescription: input.longDescription ?? null,
      manufacturer: input.manufacturer ?? null,
      subcategory: input.subcategory ?? null,
      categoryId: input.categoryId,
      sortOrder: input.sortOrder ?? existing.sortOrder,
      priority: input.priority ?? existing.priority,
      status,
      affiliateLink: input.affiliateLink ?? null,
      amazonLink: input.amazonLink ?? null,
      shopLink: input.shopLink ?? null,
      partnerProgramId: input.partnerProgramId ?? null,
      isMasterRecommendation: input.isMasterRecommendation ?? false,
      masterRecommendationText: input.masterRecommendationText ?? null,
      seoTitle: input.seoTitle ?? existing.seoTitle,
      seoDescription: input.seoDescription ?? existing.seoDescription,
      ogTitle: input.ogTitle ?? existing.ogTitle,
      ogDescription: input.ogDescription ?? existing.ogDescription,
      publishedAt:
        status === "published"
          ? existing.publishedAt ?? new Date()
          : status === "draft"
            ? null
            : existing.publishedAt,
      archivedAt: status === "archived" ? new Date() : null,
    },
  });

  await syncLinks(id, input.linkedRecipeIds);

  const detail = await getAdminProductRecommendation(id);

  if (!detail) {
    return userFailure({ code: "INTERNAL_ERROR", message: "Produkt konnte nicht geladen werden." });
  }

  return userSuccess(detail);
}

export async function deleteProductRecommendation(id: string): Promise<UserServiceResult<{ deleted: boolean }>> {
  await prisma.productRecommendation.delete({ where: { id } });
  return userSuccess({ deleted: true });
}

export async function listAdminProductRecommendationCategories(
  includeInactive = true,
): Promise<ProductRecommendationCategoryEntry[]> {
  await ensureDefaultProductRecommendationCategories();
  const categories = await listProductRecommendationCategories();

  if (!includeInactive) {
    return categories;
  }

  const all = await prisma.productRecommendationCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: { select: { products: true } },
    },
  });

  return all.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    placeholderImageUrl: getCategoryPlaceholderPublicUrl(category.id),
    hasCustomPlaceholderImage: Boolean(category.placeholderImageStorageKey),
    productCount: category._count.products,
    isSystemCategory: isDefaultProductRecommendationCategorySlug(category.slug),
  }));
}

export async function deleteProductRecommendationCategory(
  categoryId: string,
): Promise<UserServiceResult<{ deleted: boolean }>> {
  const existing = await prisma.productRecommendationCategory.findUnique({
    where: { id: categoryId },
    include: { _count: { select: { products: true } } },
  });

  if (!existing) {
    return userFailure({ code: "NOT_FOUND", message: "Kategorie nicht gefunden." });
  }

  if (isDefaultProductRecommendationCategorySlug(existing.slug)) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message:
        "System-Kategorien können nicht gelöscht werden. Du kannst sie stattdessen deaktivieren.",
    });
  }

  if (existing._count.products > 0) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: `Kategorie kann nicht gelöscht werden — ${existing._count.products} Produkt(e) sind noch zugeordnet.`,
    });
  }

  await prisma.productRecommendationCategory.delete({ where: { id: categoryId } });

  return userSuccess({ deleted: true });
}

export async function clearCategoryPlaceholderImage(
  categoryId: string,
): Promise<UserServiceResult<ProductRecommendationCategoryEntry>> {
  const existing = await prisma.productRecommendationCategory.findUnique({
    where: { id: categoryId },
    include: { _count: { select: { products: true } } },
  });

  if (!existing) {
    return userFailure({ code: "NOT_FOUND", message: "Kategorie nicht gefunden." });
  }

  const category = await prisma.productRecommendationCategory.update({
    where: { id: categoryId },
    data: { placeholderImageStorageKey: null },
    include: { _count: { select: { products: true } } },
  });

  return userSuccess({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    placeholderImageUrl: getCategoryPlaceholderPublicUrl(category.id),
    hasCustomPlaceholderImage: false,
    productCount: category._count.products,
    isSystemCategory: isDefaultProductRecommendationCategorySlug(category.slug),
  });
}

export async function upsertProductRecommendationCategory(input: {
  id?: string;
  name: string;
  slug?: string;
  description?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<ProductRecommendationCategoryEntry> {
  const slug = slugify(input.slug ?? input.name);

  const category = input.id
    ? await prisma.productRecommendationCategory.update({
        where: { id: input.id },
        data: {
          name: input.name.trim(),
          slug,
          description: input.description ?? null,
          sortOrder: input.sortOrder ?? 100,
          isActive: input.isActive ?? true,
        },
        include: { _count: { select: { products: true } } },
      })
    : await prisma.productRecommendationCategory.create({
        data: {
          name: input.name.trim(),
          slug,
          description: input.description ?? null,
          sortOrder: input.sortOrder ?? 100,
          isActive: input.isActive ?? true,
        },
        include: { _count: { select: { products: true } } },
      });

  return {
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    placeholderImageUrl: getCategoryPlaceholderPublicUrl(category.id),
    hasCustomPlaceholderImage: Boolean(category.placeholderImageStorageKey),
    productCount: category._count.products,
    isSystemCategory: isDefaultProductRecommendationCategorySlug(category.slug),
  };
}

export async function getProductRecommendationAnalytics(): Promise<ProductRecommendationAnalytics> {
  const products = await prisma.productRecommendation.findMany({
    orderBy: [
      { viewCount: "desc" },
      { amazonClickCount: "desc" },
      { shopClickCount: "desc" },
    ],
    take: 10,
    select: {
      id: true,
      title: true,
      slug: true,
      viewCount: true,
      amazonClickCount: true,
      shopClickCount: true,
      affiliateClickCount: true,
    },
  });

  const totals = await prisma.productRecommendation.aggregate({
    _sum: {
      viewCount: true,
      amazonClickCount: true,
      shopClickCount: true,
      affiliateClickCount: true,
    },
  });

  return {
    topProducts: products.map((product) => ({
      ...product,
      totalClicks:
        product.amazonClickCount + product.shopClickCount + product.affiliateClickCount,
    })),
    totals: {
      views: totals._sum.viewCount ?? 0,
      amazonClicks: totals._sum.amazonClickCount ?? 0,
      shopClicks: totals._sum.shopClickCount ?? 0,
      affiliateClicks: totals._sum.affiliateClickCount ?? 0,
    },
  };
}

export async function seedProductRecommendationSystem(): Promise<{
  categories: number;
  partnerPrograms: number;
}> {
  await ensureDefaultPartnerPrograms();

  for (const category of DEFAULT_PRODUCT_RECOMMENDATION_CATEGORIES) {
    await prisma.productRecommendationCategory.upsert({
      where: { slug: category.slug },
      create: {
        name: category.name,
        slug: category.slug,
        sortOrder: category.sortOrder,
        isActive: true,
      },
      update: {
        name: category.name,
        sortOrder: category.sortOrder,
        isActive: true,
      },
    });
  }

  const categories = await prisma.productRecommendationCategory.count();
  const partnerPrograms = await prisma.partnerProgram.count();

  return { categories, partnerPrograms };
}
