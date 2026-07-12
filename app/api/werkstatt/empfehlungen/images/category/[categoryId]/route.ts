import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { CATEGORY_PLACEHOLDER_IMAGES } from "@/lib/product-recommendations/product-recommendation-categories";
import { readProductRecommendationImageBytes } from "@/lib/product-recommendations/product-recommendation-image-storage";
import { readFile } from "node:fs/promises";
import path from "node:path";

type RouteContext = { params: Promise<{ categoryId: string }> };

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { categoryId } = await context.params;

  const category = await prisma.productRecommendationCategory.findUnique({
    where: { id: categoryId },
    select: { placeholderImageStorageKey: true, slug: true },
  });

  if (!category) {
    return new NextResponse(null, { status: 404 });
  }

  if (category.placeholderImageStorageKey) {
    const bytes = await readProductRecommendationImageBytes(
      category.placeholderImageStorageKey,
    );

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  const placeholderPath = CATEGORY_PLACEHOLDER_IMAGES[category.slug] ?? CATEGORY_PLACEHOLDER_IMAGES.sonstiges;
  const absolutePath = path.join(process.cwd(), "public", placeholderPath.replace(/^\//, ""));

  try {
    const bytes = await readFile(absolutePath);
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
