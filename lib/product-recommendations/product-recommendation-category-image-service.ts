/**
 * @file product-recommendation-category-image-service.ts
 * @purpose Upload und Verwaltung von Kategorie-Standardbildern.
 */

import { prisma } from "@/lib/db/prisma";

import {
  inferProductImageMimeType,
  saveProductRecommendationImage,
} from "./product-recommendation-image-storage";

export async function saveCategoryPlaceholderImage(
  categoryId: string,
  file: File,
): Promise<{ storageKey: string }> {
  const category = await prisma.productRecommendationCategory.findUnique({
    where: { id: categoryId },
    select: { id: true },
  });

  if (!category) {
    throw new Error("Kategorie nicht gefunden.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const resolvedMimeType = inferProductImageMimeType(file.name, file.type || "");
  const saved = await saveProductRecommendationImage(
    categoryId,
    file.name,
    resolvedMimeType,
    bytes,
    "placeholder",
  );

  await prisma.productRecommendationCategory.update({
    where: { id: categoryId },
    data: { placeholderImageStorageKey: saved.storageKey },
  });

  return { storageKey: saved.storageKey };
}
