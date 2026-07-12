import { NextResponse } from "next/server";

import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import {
  deleteProductRecommendation,
  getAdminProductRecommendation,
  updateProductRecommendation,
} from "@/lib/product-recommendations/product-recommendation-admin-service";
import type { UpsertProductRecommendationInput } from "@/lib/product-recommendations/product-recommendation-types";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);
  if (denied) return denied;

  const { id } = await context.params;
  const product = await getAdminProductRecommendation(id);

  if (!product) {
    return NextResponse.json(
      { success: false, error: { message: "Produkt nicht gefunden." } },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, data: product });
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);
  if (denied) return denied;

  const { id } = await context.params;
  const body = (await request.json()) as UpsertProductRecommendationInput;
  const result = await updateProductRecommendation(id, body);

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: { message: result.error.message } },
      { status: 400 },
    );
  }

  return NextResponse.json({ success: true, data: result.data });
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);
  if (denied) return denied;

  const { id } = await context.params;
  await deleteProductRecommendation(id);

  return NextResponse.json({ success: true, data: { deleted: true } });
}
