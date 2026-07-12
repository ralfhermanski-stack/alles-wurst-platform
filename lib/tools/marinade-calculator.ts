/**
 * @file marinade-calculator.ts
 * @purpose Skalierung und Validierung für Marinaden-Rezepte.
 */

import type {
  MarinadeCalculationResult,
  MarinadeIngredientLine,
  MarinadeRecipePayload,
} from "./marinade-types";

const SALT_MIN_G_PER_KG = 6;
const SALT_MAX_G_PER_KG = 20;

export function normalizeWeightKg(
  value: number,
  unit: "kg" | "g",
): number {
  if (unit === "g") {
    return value / 1000;
  }

  return value;
}

export function calculateMarinade(
  payload: MarinadeRecipePayload,
): MarinadeCalculationResult {
  const totalWeightKg = Math.max(0, payload.totalWeightKg);
  const totalWeightGrams = totalWeightKg * 1000;

  const ingredients = payload.ingredients
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((ingredient) => {
      const totalAmount =
        Math.round(ingredient.amountPerKg * totalWeightKg * 10) / 10;

      return {
        ...ingredient,
        totalAmount,
        percentOfTotal:
          totalWeightGrams > 0
            ? Math.round((totalAmount / totalWeightGrams) * 1000) / 10
            : 0,
      };
    });

  const totalMarinadeGrams = ingredients.reduce(
    (sum, row) => sum + row.totalAmount,
    0,
  );

  return {
    totalWeightKg,
    totalWeightGrams,
    ingredients,
    totalMarinadeGrams: Math.round(totalMarinadeGrams * 10) / 10,
    warnings: collectWarnings(payload, ingredients),
  };
}

function collectWarnings(
  payload: MarinadeRecipePayload,
  ingredients: MarinadeIngredientLine[],
): string[] {
  const warnings = new Set(payload.warnings);

  if (payload.totalWeightKg <= 0) {
    warnings.add("Gesamtgewicht muss größer als 0 sein.");
  }

  for (const ingredient of ingredients) {
    if (ingredient.amountPerKg < 0) {
      warnings.add(`Negative Menge bei „${ingredient.name}“ ist nicht erlaubt.`);
    }
  }

  const saltLine = ingredients.find((row) => row.group === "salt");

  if (saltLine) {
    if (saltLine.amountPerKg < SALT_MIN_G_PER_KG) {
      warnings.add(
        `Salzmenge (${saltLine.amountPerKg} g/kg) liegt unter dem empfohlenen Minimum.`,
      );
    }

    if (saltLine.amountPerKg > SALT_MAX_G_PER_KG) {
      warnings.add(
        `Salzmenge (${saltLine.amountPerKg} g/kg) liegt über dem empfohlenen Maximum.`,
      );
    }
  }

  if (payload.marinadeStyle === "beer") {
    warnings.add("Enthält Alkohol (Bier) — Hinweis auf Etikett/PDF beachten.");
  }

  if (payload.marinadeStyle === "honey" || ingredients.some((i) => i.group === "sugar")) {
    warnings.add("Enthält Zucker/Honig — Verbrennungsgefahr bei hoher Hitze beachten.");
  }

  if (payload.productType === "poultry") {
    warnings.add("Geflügel-Hygiene: getrennt lagern und vollständig durchgaren.");
  }

  if (payload.productType === "fish") {
    warnings.add("Fisch-Hygiene: kühl halten, Marinade nicht wiederverwenden.");
  }

  for (const ingredient of ingredients) {
    if (ingredient.allergen?.trim()) {
      warnings.add(`Allergen: ${ingredient.name} (${ingredient.allergen})`);
    }
  }

  return [...warnings];
}

export function validateMarinadeForSave(
  payload: MarinadeRecipePayload,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!payload.productName.trim()) {
    errors.push("Produktname ist erforderlich.");
  }

  if (payload.totalWeightKg <= 0) {
    errors.push("Gesamtgewicht muss größer als 0 sein.");
  }

  if (payload.ingredients.length === 0) {
    errors.push("Mindestens eine Zutat ist erforderlich.");
  }

  if (!payload.marinationTime.trim()) {
    errors.push("Ziehzeit ist erforderlich.");
  }

  for (const ingredient of payload.ingredients) {
    if (!ingredient.name.trim()) {
      errors.push("Alle Zutaten brauchen einen Namen.");
    }

    if (ingredient.amountPerKg < 0) {
      errors.push(`Zutat „${ingredient.name}“ hat eine negative Menge.`);
    }
  }

  return { valid: errors.length === 0, errors };
}
