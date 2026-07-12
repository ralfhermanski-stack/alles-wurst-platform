import { NextResponse } from "next/server";

import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import {
  listAdminProductRecommendationCategories,
  upsertProductRecommendationCategory,
} from "@/lib/product-recommendations/product-recommendation-admin-service";
import { saveProductRecommendationImage } from "@/lib/product-recommendations/product-recommendation-image-storage";
import { prisma } from "@/lib/db/prisma";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);
  if (denied) return denied;

  const categories = await listAdminProductRecommendationCategories(true);
  return NextResponse.json({ success: true, data: categories });
}

export async function POST(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);
  if (denied) return denied;

  const body = (await request.json()) as {
    id?: string;
    name?: string;
    slug?: string;
    description?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  };

  if (!body.name?.trim()) {
    return NextResponse.json(
      { success: false, error: { message: "Name ist erforderlich." } },
      { status: 400 },
    );
  }

  const category = await upsertProductRecommendationCategory({
    id: body.id,
    name: body.name,
    slug: body.slug,
    description: body.description,
    sortOrder: body.sortOrder,
    isActive: body.isActive,
  });

  return NextResponse.json({ success: true, data: category });
}

export async function PUT(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);
  if (denied) return denied;

  const formData = await request.formData();
  const categoryId = String(formData.get("categoryId") ?? "");
  const file = formData.get("file");

  if (!categoryId || !(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: { message: "Kategorie und Bild erforderlich." } },
      { status: 400 },
    );
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const saved = await saveProductRecommendationImage(
    categoryId,
    file.name,
    file.type,
    bytes,
    "placeholder",
  );

  await prisma.productRecommendationCategory.update({
    where: { id: categoryId },
    data: { placeholderImageStorageKey: saved.storageKey },
  });

  return NextResponse.json({ success: true, data: { storageKey: saved.storageKey } });
}
