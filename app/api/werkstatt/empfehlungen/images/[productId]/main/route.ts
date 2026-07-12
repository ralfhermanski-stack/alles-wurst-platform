import { NextResponse } from "next/server";

import { prisma } from "@/lib/db/prisma";
import { readProductRecommendationImageBytes } from "@/lib/product-recommendations/product-recommendation-image-storage";

type RouteContext = { params: Promise<{ productId: string }> };

function mimeFromKey(storageKey: string): string {
  if (storageKey.endsWith(".webp")) return "image/webp";
  if (storageKey.endsWith(".png")) return "image/png";
  return "image/jpeg";
}

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { productId } = await context.params;

  const product = await prisma.productRecommendation.findUnique({
    where: { id: productId },
    select: { mainImageStorageKey: true },
  });

  if (!product?.mainImageStorageKey) {
    return new NextResponse(null, { status: 404 });
  }

  const bytes = await readProductRecommendationImageBytes(product.mainImageStorageKey);

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": mimeFromKey(product.mainImageStorageKey),
      "Cache-Control": "public, max-age=86400",
    },
  });
}
