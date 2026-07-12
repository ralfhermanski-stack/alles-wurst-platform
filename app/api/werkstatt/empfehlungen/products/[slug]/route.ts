import { NextResponse } from "next/server";

import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { getPublishedProductRecommendationBySlug } from "@/lib/product-recommendations/product-recommendation-service";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { slug } = await context.params;
  const userId = await getSessionUserIdFromRequest(_request);

  const product = await getPublishedProductRecommendationBySlug(slug, {
    recordView: true,
    userId,
  });

  if (!product) {
    return NextResponse.json(
      { success: false, error: { message: "Produkt nicht gefunden." } },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, data: product });
}
