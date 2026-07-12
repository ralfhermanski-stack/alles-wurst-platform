import { NextResponse } from "next/server";

import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import type { ProductRecommendationClickType } from "@prisma/client";
import { recordProductRecommendationEvent } from "@/lib/product-recommendations/product-recommendation-service";

type RouteContext = { params: Promise<{ productId: string }> };

const ALLOWED_TYPES = new Set<ProductRecommendationClickType>([
  "amazon",
  "shop",
  "affiliate",
]);

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { productId } = await context.params;
  const body = (await request.json()) as { eventType?: ProductRecommendationClickType };
  const userId = await getSessionUserIdFromRequest(request);

  if (!body.eventType || !ALLOWED_TYPES.has(body.eventType)) {
    return NextResponse.json(
      { success: false, error: { message: "Ungültiger Klicktyp." } },
      { status: 400 },
    );
  }

  await recordProductRecommendationEvent(productId, body.eventType, userId);

  return NextResponse.json({ success: true, data: { tracked: true } });
}
