import { NextResponse } from "next/server";

import {
  getAffiliateDisclosureText,
  listProductRecommendationCategories,
  listPublishedProductRecommendations,
} from "@/lib/product-recommendations/product-recommendation-service";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const categorySlug = url.searchParams.get("category") ?? undefined;
  const search = url.searchParams.get("q") ?? undefined;

  const [products, categories, disclosure] = await Promise.all([
    listPublishedProductRecommendations({ categorySlug, search }),
    listProductRecommendationCategories(),
    getAffiliateDisclosureText(),
  ]);

  return NextResponse.json({
    success: true,
    data: { products, categories, disclosure },
  });
}
