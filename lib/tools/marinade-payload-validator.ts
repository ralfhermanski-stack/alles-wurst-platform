/**
 * @file marinade-payload-validator.ts
 */

import type { MarinadeRecipePayload } from "./marinade-types";
import { EMPTY_MARINADE_PAYLOAD } from "./marinade-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function parseMarinadePayload(value: unknown): MarinadeRecipePayload | null {
  if (!isRecord(value) || value.recipeKind !== "marinade") {
    return null;
  }

  const ingredients = Array.isArray(value.ingredients)
    ? value.ingredients
        .filter(isRecord)
        .map((row, index) => ({
          id: typeof row.id === "string" ? row.id : `ing-${index}`,
          name: typeof row.name === "string" ? row.name : "",
          amountPerKg: isFiniteNumber(row.amountPerKg) ? row.amountPerKg : 0,
          unit: row.unit === "ml" ? ("ml" as const) : ("g" as const),
          group:
            typeof row.group === "string"
              ? (row.group as MarinadeRecipePayload["ingredients"][0]["group"])
              : "other",
          allergen: typeof row.allergen === "string" ? row.allergen : null,
          isCustom: Boolean(row.isCustom),
          sortOrder: isFiniteNumber(row.sortOrder) ? row.sortOrder : index,
        }))
    : [];

  const steps = Array.isArray(value.steps)
    ? value.steps
        .filter(isRecord)
        .map((row, index) => ({
          title: typeof row.title === "string" ? row.title : "",
          description:
            typeof row.description === "string" ? row.description : undefined,
          sortOrder: isFiniteNumber(row.sortOrder) ? row.sortOrder : index,
        }))
    : [];

  return {
    recipeKind: "marinade",
    productName: typeof value.productName === "string" ? value.productName : "",
    productType:
      typeof value.productType === "string"
        ? (value.productType as MarinadeRecipePayload["productType"])
        : "pork",
    marinadeStyle:
      typeof value.marinadeStyle === "string"
        ? (value.marinadeStyle as MarinadeRecipePayload["marinadeStyle"])
        : "oil",
    intensity:
      typeof value.intensity === "string"
        ? (value.intensity as MarinadeRecipePayload["intensity"])
        : "medium",
    marinationTime:
      typeof value.marinationTime === "string" ? value.marinationTime : "",
    preparationMethod:
      typeof value.preparationMethod === "string"
        ? (value.preparationMethod as MarinadeRecipePayload["preparationMethod"])
        : "grill",
    totalWeightKg: isFiniteNumber(value.totalWeightKg) ? value.totalWeightKg : 1,
    weightInputUnit: value.weightInputUnit === "g" ? "g" : "kg",
    ingredients,
    steps,
    notes: typeof value.notes === "string" ? value.notes : undefined,
    allergens: Array.isArray(value.allergens)
      ? value.allergens.filter((entry): entry is string => typeof entry === "string")
      : [],
    warnings: Array.isArray(value.warnings)
      ? value.warnings.filter((entry): entry is string => typeof entry === "string")
      : [],
    hints: isRecord(value.hints)
      ? {
          processing:
            typeof value.hints.processing === "string"
              ? value.hints.processing
              : undefined,
          storage:
            typeof value.hints.storage === "string"
              ? value.hints.storage
              : undefined,
          hygiene:
            typeof value.hints.hygiene === "string"
              ? value.hints.hygiene
              : undefined,
        }
      : {},
  };
}

export function getDefaultMarinadePayload(): MarinadeRecipePayload {
  return structuredClone(EMPTY_MARINADE_PAYLOAD);
}
