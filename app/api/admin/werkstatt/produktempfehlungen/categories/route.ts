import { NextResponse } from "next/server";

import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import {
  listAdminProductRecommendationCategories,
  upsertProductRecommendationCategory,
  clearCategoryPlaceholderImage,
} from "@/lib/product-recommendations/product-recommendation-admin-service";
import { saveCategoryPlaceholderImage } from "@/lib/product-recommendations/product-recommendation-category-image-service";

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

  try {
    const formData = await request.formData();
    const categoryId = String(formData.get("categoryId") ?? "");
    const file = formData.get("file");

    if (!categoryId || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: { message: "Kategorie und Bild erforderlich." } },
        { status: 400 },
      );
    }

    const saved = await saveCategoryPlaceholderImage(categoryId, file);

    return NextResponse.json({ success: true, data: saved });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Bild-Upload fehlgeschlagen.",
        },
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);
  if (denied) return denied;

  const url = new URL(request.url);
  const categoryId = url.searchParams.get("categoryId") ?? "";
  const action = url.searchParams.get("action");

  if (!categoryId) {
    return NextResponse.json(
      { success: false, error: { message: "Kategorie-ID erforderlich." } },
      { status: 400 },
    );
  }

  if (action === "placeholder") {
    const result = await clearCategoryPlaceholderImage(categoryId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: { message: result.error.message } },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, data: result.data });
  }

  return NextResponse.json(
    { success: false, error: { message: "Unbekannte Aktion." } },
    { status: 400 },
  );
}
