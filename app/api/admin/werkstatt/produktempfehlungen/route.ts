import { NextResponse } from "next/server";

import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  createProductRecommendation,
  getProductRecommendationAnalytics,
  listAdminProductRecommendations,
} from "@/lib/product-recommendations/product-recommendation-admin-service";
import type { ProductRecommendationStatus } from "@prisma/client";
import type { UpsertProductRecommendationInput } from "@/lib/product-recommendations/product-recommendation-types";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") as ProductRecommendationStatus | null;
  const categoryId = url.searchParams.get("categoryId") ?? undefined;
  const search = url.searchParams.get("q") ?? undefined;
  const analytics = url.searchParams.get("analytics") === "1";

  if (analytics) {
    const data = await getProductRecommendationAnalytics();
    return NextResponse.json({ success: true, data });
  }

  const products = await listAdminProductRecommendations({
    status: status ?? undefined,
    categoryId,
    search,
  });

  return NextResponse.json({ success: true, data: products });
}

export async function POST(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);
  if (denied) return denied;

  const body = (await request.json()) as UpsertProductRecommendationInput;
  const result = await createProductRecommendation(body);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { message: result.error.message } },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}
