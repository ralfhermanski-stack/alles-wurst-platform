import { NextResponse } from "next/server";

import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { saveProductRecommendationImage } from "@/lib/product-recommendations/product-recommendation-image-storage";
import { prisma } from "@/lib/db/prisma";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);
  if (denied) return denied;

  const { id } = await context.params;

  try {
    const product = await prisma.productRecommendation.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: { message: "Produkt nicht gefunden." } },
        { status: 404 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const kind = String(formData.get("kind") ?? "main");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: { message: "Bild erforderlich." } },
        { status: 400 },
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const saved = await saveProductRecommendationImage(
      id,
      file.name,
      file.type || "image/jpeg",
      bytes,
      kind,
    );

    if (kind === "gallery") {
      const image = await prisma.productRecommendationGalleryImage.create({
        data: {
          productId: id,
          storageKey: saved.storageKey,
        },
      });

      return NextResponse.json({
        success: true,
        data: { imageId: image.id, storageKey: saved.storageKey },
      });
    }

    await prisma.productRecommendation.update({
      where: { id },
      data: { mainImageStorageKey: saved.storageKey },
    });

    return NextResponse.json({ success: true, data: { storageKey: saved.storageKey } });
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
