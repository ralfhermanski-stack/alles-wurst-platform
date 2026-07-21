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

export type RecipePdfData = {
  recipe: ApiRecipe;
  calculation: RecipeCalculationResult;
  plausibilityIssues: PlausibilityIssue[];
  imageUrl: string | null;
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
 * Berechnet alle für den Export benötigten Daten aus einem API-Rezept.
 */
export function prepareRecipePdfData(
  recipe: ApiRecipe,
  options?: {
    authorName?: string | null;
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

  return {
    success: true,
    data: {
      recipe,
      calculation: calculationRun.result,
      plausibilityIssues: plausibility.issues,
      imageUrl: recipe.hasImage ? `/api/recipes/${recipe.id}/image` : null,
      authorName: options?.authorName?.trim() || null,
    },
  };
}
