/**
 * @file marinade-types.ts
 * @purpose Typen für Marinaden-Rezepte (payload in recipes.payload).
 */

export type MarinadeProductType =
  | "pork"
  | "beef"
  | "poultry"
  | "game"
  | "fish"
  | "vegetable";

export type MarinadeStyle =
  | "oil"
  | "spice"
  | "herb"
  | "bbq"
  | "yogurt"
  | "mustard"
  | "beer"
  | "honey"
  | "garlic"
  | "asian"
  | "spicy"
  | "dry_rub";

export type MarinadeIntensity = "mild" | "medium" | "strong";

export type MarinadePreparation =
  | "grill"
  | "roast"
  | "pan"
  | "oven"
  | "smoker"
  | "sous_vide";

export type MarinadeIngredientGroup =
  | "oil"
  | "salt"
  | "sugar"
  | "acid"
  | "spice"
  | "herb"
  | "liquid"
  | "other";

export type MarinadeIngredientUnit = "g" | "ml";

export type MarinadeIngredientLine = {
  id: string;
  name: string;
  amountPerKg: number;
  unit: MarinadeIngredientUnit;
  group: MarinadeIngredientGroup;
  allergen?: string | null;
  isCustom?: boolean;
  sortOrder: number;
};

export type MarinadeStep = {
  title: string;
  description?: string;
  sortOrder: number;
};

export type MarinadeHints = {
  processing?: string;
  storage?: string;
  hygiene?: string;
};

export type MarinadeRecipePayload = {
  recipeKind: "marinade";
  productName: string;
  productType: MarinadeProductType;
  marinadeStyle: MarinadeStyle;
  intensity: MarinadeIntensity;
  marinationTime: string;
  preparationMethod: MarinadePreparation;
  totalWeightKg: number;
  weightInputUnit: "kg" | "g";
  ingredients: MarinadeIngredientLine[];
  steps: MarinadeStep[];
  notes?: string;
  allergens: string[];
  warnings: string[];
  hints: MarinadeHints;
};

export type MarinadeIngredientCalculated = MarinadeIngredientLine & {
  totalAmount: number;
  percentOfTotal: number;
};

export type MarinadeCalculationResult = {
  totalWeightKg: number;
  totalWeightGrams: number;
  ingredients: MarinadeIngredientCalculated[];
  totalMarinadeGrams: number;
  warnings: string[];
};

export const EMPTY_MARINADE_PAYLOAD: MarinadeRecipePayload = {
  recipeKind: "marinade",
  productName: "",
  productType: "pork",
  marinadeStyle: "oil",
  intensity: "medium",
  marinationTime: "4–8 Stunden",
  preparationMethod: "grill",
  totalWeightKg: 1,
  weightInputUnit: "kg",
  ingredients: [],
  steps: [],
  allergens: [],
  warnings: [],
  hints: {},
};
