/**
 * @file product-recommendation-types.ts
 */

import type { PartnerProgramType, ProductRecommendationStatus } from "@prisma/client";

export type ProductRecommendationCategoryEntry = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  placeholderImageUrl: string | null;
  hasCustomPlaceholderImage: boolean;
  productCount: number;
  isSystemCategory: boolean;
};

export type ProductRecommendationSummary = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  manufacturer: string | null;
  subcategory: string | null;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  imageUrl: string | null;
  status: ProductRecommendationStatus;
  sortOrder: number;
  priority: number;
  isMasterRecommendation: boolean;
  hasAmazonLink: boolean;
  hasShopLink: boolean;
  hasAffiliateLink: boolean;
  viewCount: number;
  publishedAt: string | null;
};

export type ProductRecommendationDetail = ProductRecommendationSummary & {
  longDescription: string | null;
  masterRecommendationText: string | null;
  amazonUrl: string | null;
  shopUrl: string | null;
  affiliateUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  galleryImageUrls: string[];
  linkedCourseIds: string[];
  linkedRecipeIds: string[];
};

export type AdminProductRecommendationDetail = ProductRecommendationDetail &
  Pick<
    UpsertProductRecommendationInput,
    "amazonLink" | "shopLink" | "affiliateLink" | "partnerProgramId"
  >;

export type PartnerProgramEntry = {
  id: string;
  name: string;
  slug: string;
  programType: PartnerProgramType;
  affiliateId: string | null;
  urlTemplate: string | null;
  baseUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  note: string | null;
};

export type ProductRecommendationSettingsEntry = {
  affiliateDisclosureText: string;
  defaultAmazonProgramId: string | null;
};

export type ProductRecommendationAnalytics = {
  topProducts: Array<{
    id: string;
    title: string;
    slug: string;
    viewCount: number;
    amazonClickCount: number;
    shopClickCount: number;
    affiliateClickCount: number;
    totalClicks: number;
  }>;
  totals: {
    views: number;
    amazonClicks: number;
    shopClicks: number;
    affiliateClicks: number;
  };
};

export type UpsertProductRecommendationInput = {
  title: string;
  slug?: string;
  shortDescription: string;
  longDescription?: string | null;
  manufacturer?: string | null;
  subcategory?: string | null;
  categoryId: string;
  sortOrder?: number;
  priority?: number;
  status?: ProductRecommendationStatus;
  affiliateLink?: string | null;
  amazonLink?: string | null;
  shopLink?: string | null;
  partnerProgramId?: string | null;
  isMasterRecommendation?: boolean;
  masterRecommendationText?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  linkedCourseIds?: string[];
  linkedRecipeIds?: string[];
};

export type UpsertPartnerProgramInput = {
  name: string;
  slug?: string;
  programType: PartnerProgramType;
  affiliateId?: string | null;
  urlTemplate?: string | null;
  baseUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
  note?: string | null;
};
