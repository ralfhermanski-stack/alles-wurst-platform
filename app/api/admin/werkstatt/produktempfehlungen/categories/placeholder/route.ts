import { NextResponse } from "next/server";

import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { saveCategoryPlaceholderImage } from "@/lib/product-recommendations/product-recommendation-category-image-service";

export async function POST(request: Request): Promise<Response> {
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
