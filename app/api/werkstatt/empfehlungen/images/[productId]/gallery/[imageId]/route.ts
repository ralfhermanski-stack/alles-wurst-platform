import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { readProductRecommendationImageBytes } from "@/lib/product-recommendations/product-recommendation-image-storage";

type RouteContext = { params: Promise<{ productId: string; imageId: string }> };

function mimeFromKey(storageKey: string): string {
  if (storageKey.endsWith(".webp")) return "image/png";
  if (storageKey.endsWith(".png")) return "image/png";
  return "image/jpeg";
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { productId, imageId } = await context.params;

  const image = await prisma.productRecommendationGalleryImage.findFirst({
    where: { id: imageId, productId },
    select: { storageKey: true },
  });

  if (!image) {
    return new NextResponse(null, { status: 404 });
  }

  const bytes = await readProductRecommendationImageBytes(image.storageKey);

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": mimeFromKey(image.storageKey),
      "Cache-Control": "public, max-age=86400",
    },
  });
}
