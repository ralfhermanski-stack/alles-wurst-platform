/**
 * @file recipe-pdf-data.ts
 * @purpose Bereitet gespeicherte Rezepte für den PDF-/Druck-Export auf.
 */

import { runRecipeCalculation } from "./recipe-calculator";
import type { ApiRecipe } from "./recipe-client";
import {
  checkRecipePlausibility,
  type PlausibilityIssue,
  type RecipePlausibilityContext,
} from "./recipe-plausibility";
import type { RecipeCalculationResult } from "./recipe-types";

/** Öffentlicher Pfad zum Produktbild eines Rezepts. */
export function getRecipeImagePublicPath(recipeId: string): string {
  return `/api/recipes/${recipeId}/image`;
}

/** Statisches Wasserzeichen für den Rezept-PDF-Export. */
export const RECIPE_PDF_WATERMARK_SRC = "/brand/alles-wurst-watermark.png";

export type RecipePdfData = {
  recipe: ApiRecipe;
  calculation: RecipeCalculationResult;
  plausibilityIssues: PlausibilityIssue[];
  imageUrl: string | null;
  watermarkUrl: string;
  authorName: string | null;
};

export type RecipePdfDataResult =
  | { success: true; data: RecipePdfData }
  | { success: false; error: string };

/**
 * Leitet den Plausibilitätskontext aus einem gespeicherten Rezept ab.
 */
export function buildPlausibilityContextFromRecipe(
  recipe: ApiRecipe,
): RecipePlausibilityContext {
  const { payload } = recipe;
  const smokingPhases = payload.smoking?.phases ?? [];
  const smokingNotes = payload.smoking?.notes ?? "";
  const smokingActive =
    smokingPhases.length > 0 || smokingNotes.trim().length > 0;
  const smokingIncomplete =
    smokingPhases.length > 0 &&
    smokingPhases.some(
      (phase) =>
        !phase.name.trim() ||
        phase.temperatureC === undefined ||
        phase.durationMin === undefined,
    );

  return {
    payload,
    category: recipe.category ?? "",
    casingType: payload.casing?.casingType ?? "",
    productionStepCount: (payload.production?.steps ?? []).filter((step) =>
      step.title.trim(),
    ).length,
    smokingActive,
    smokingIncomplete,
  };
}

/**
 * Verkleinert ein Produktbild auf druckfreundliche Größe und liefert eine Data-URL.
 * Große Originaldateien (mehrere MB) fehlen sonst oft im Druckdialog.
 */
async function blobToPrintDataUrl(
  blob: Blob,
  maxEdgePx = 900,
): Promise<string> {
  const bitmap = await createImageBitmap(blob);
  const scale = Math.min(1, maxEdgePx / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");

  if (!context) {
    bitmap.close();
    throw new Error("Canvas nicht verfügbar.");
  }

  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", 0.86);
}

async function resolvePublicAssetForPrint(
  path: string,
  options?: { asJpeg?: boolean; maxEdgePx?: number },
): Promise<string> {
  const absoluteUrl =
    typeof window !== "undefined"
      ? new URL(path, window.location.origin).href
      : path;

  try {
    const response = await fetch(absoluteUrl, {
      credentials: "include",
      cache: "force-cache",
    });

    if (!response.ok) {
      return absoluteUrl;
    }

    const blob = await response.blob();

    if (options?.asJpeg) {
      try {
        return await blobToPrintDataUrl(blob, options.maxEdgePx ?? 900);
      } catch {
        return URL.createObjectURL(blob);
      }
    }

    // Wasserzeichen: PNG mit Alpha als Data-URL behalten
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
          return;
        }
        reject(new Error("Data-URL fehlgeschlagen."));
      };
      reader.onerror = () => reject(new Error("Asset konnte nicht gelesen werden."));
      reader.readAsDataURL(blob);
    });
  } catch {
    return absoluteUrl;
  }
}

/**
 * Lädt das Produktbild und bereitet es für den Druck/PDF-Export vor.
 * Liefert eine eingebettete Data-URL (kein zusätzlicher Netz-Request beim Drucken).
 */
export async function resolveRecipePdfImageUrl(
  recipe: Pick<ApiRecipe, "id" | "hasImage">,
): Promise<string | null> {
  if (!recipe.hasImage) {
    return null;
  }

  return resolvePublicAssetForPrint(getRecipeImagePublicPath(recipe.id), {
    asJpeg: true,
    maxEdgePx: 900,
  });
}

/**
 * Lädt das Crest-Wasserzeichen als eingebettete Data-URL für den Druck.
 */
export async function resolveRecipePdfWatermarkUrl(): Promise<string> {
  try {
    return await resolvePublicAssetForPrint(RECIPE_PDF_WATERMARK_SRC);
  } catch {
    return RECIPE_PDF_WATERMARK_SRC;
  }
}

/**
 * Wartet, bis alle Bilder im Druckdokument dekodiert sind.
 */
export async function waitForRecipePrintImages(
  root: ParentNode | null,
): Promise<void> {
  if (!root) {
    return;
  }

  const images = Array.from(root.querySelectorAll("img"));

  await Promise.all(
    images.map(async (image) => {
      if (image.complete && image.naturalHeight > 0) {
        return;
      }

      try {
        await image.decode();
      } catch {
        // Fehlende/defekte Bilder sollen den Druck nicht blockieren.
      }
    }),
  );
}

/**
 * Berechnet alle für den Export benötigten Daten aus einem API-Rezept.
 */
export function prepareRecipePdfData(
  recipe: ApiRecipe,
  options?: {
    authorName?: string | null;
    imageUrl?: string | null;
    watermarkUrl?: string | null;
  },
): RecipePdfDataResult {
  const calculationRun = runRecipeCalculation(recipe.payload);

  if ("error" in calculationRun) {
    return { success: false, error: calculationRun.error };
  }

  const context = buildPlausibilityContextFromRecipe(recipe);
  const plausibility = checkRecipePlausibility(
    context,
    calculationRun.result,
  );

  const resolvedImageUrl =
    options?.imageUrl !== undefined
      ? options.imageUrl
      : recipe.hasImage
        ? getRecipeImagePublicPath(recipe.id)
        : null;

  return {
    success: true,
    data: {
      recipe,
      calculation: calculationRun.result,
      plausibilityIssues: plausibility.issues,
      imageUrl: resolvedImageUrl,
      watermarkUrl: options?.watermarkUrl?.trim() || RECIPE_PDF_WATERMARK_SRC,
      authorName: options?.authorName?.trim() || null,
    },
  };
}
