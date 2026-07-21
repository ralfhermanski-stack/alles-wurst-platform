/**
 * @file recipe-payload-validator.ts
 * @purpose Payload aus JSON/API parsen und vor dem Speichern validieren.
 * @responsibility Typprüfung ohne `any` und Anbindung an `runRecipeCalculation`.
 * @usage Importiert von `recipe-service.ts`.
 */

import { runRecipeCalculation } from "./recipe-calculator";
import {
  type IngredientGroup,
  type IngredientReferenceBasis,
  type MeatClassification,
  type RecipeCooking,
  type RecipeGrinding,
  type RecipeMixing,
  type RecipePayload,
  type RecipeProduction,
  type RecipeProductionStep,
  type RecipeSmoking,
  type RecipeSmokingPhase,
  EMPTY_RECIPE_PAYLOAD,
} from "./recipe-types";
import {
  recipeFailure,
  type RecipeServiceResult,
} from "./recipe-errors";

const INGREDIENT_BASES: readonly IngredientReferenceBasis[] = [
  "meat",
  "braet",
  "total",
] as const;

/**
 * Prüft, ob ein Wert ein nicht-leeres Objekt ist.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Prüft, ob ein Wert eine endliche Zahl ist.
 */
function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/**
 * Parst eine optionale endliche Zahl (auch aus Strings wie "32" oder "32 mm").
 */
function parseOptionalNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const match = value.trim().replace(",", ".").match(/-?\d+(?:\.\d+)?/);

    if (!match) {
      return undefined;
    }

    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

/**
 * Parst optionale Unterobjekte der Herstellung.
 */
function parseProduction(value: Record<string, unknown>): RecipeProduction | null {
  const production: RecipeProduction = {};

  if (value.notes !== undefined) {
    if (typeof value.notes !== "string") {
      return null;
    }
    production.notes = value.notes;
  }

  if (value.steps !== undefined) {
    if (!Array.isArray(value.steps)) {
      return null;
    }

    const steps: RecipeProductionStep[] = [];

    for (const item of value.steps) {
      if (!isRecord(item) || typeof item.title !== "string") {
        return null;
      }

      steps.push({
        title: item.title,
        description:
          typeof item.description === "string" ? item.description : undefined,
        durationMin: parseOptionalNumber(item.durationMin),
        temperatureC: parseOptionalNumber(item.temperatureC),
      });
    }

    production.steps = steps;
  }

  if (value.grinding !== undefined) {
    if (!isRecord(value.grinding)) {
      return null;
    }

    const grinding: RecipeGrinding = {
      passes: parseOptionalNumber(value.grinding.passes),
      plateMm: parseOptionalNumber(value.grinding.plateMm),
    };

    if (grinding.passes !== undefined || grinding.plateMm !== undefined) {
      production.grinding = grinding;
    }
  }

  if (value.mixing !== undefined) {
    if (!isRecord(value.mixing)) {
      return null;
    }

    const mixing: RecipeMixing = {
      durationMin: parseOptionalNumber(value.mixing.durationMin),
      endTemperatureC: parseOptionalNumber(value.mixing.endTemperatureC),
    };

    if (mixing.durationMin !== undefined || mixing.endTemperatureC !== undefined) {
      production.mixing = mixing;
    }
  }

  if (value.cooking !== undefined) {
    if (!isRecord(value.cooking)) {
      return null;
    }

    const cooking: RecipeCooking = {
      coreTempC: parseOptionalNumber(value.cooking.coreTempC),
      durationMin: parseOptionalNumber(value.cooking.durationMin),
      medium:
        typeof value.cooking.medium === "string"
          ? value.cooking.medium
          : undefined,
    };

    if (
      cooking.coreTempC !== undefined ||
      cooking.durationMin !== undefined ||
      cooking.medium !== undefined
    ) {
      production.cooking = cooking;
    }
  }

  if (value.stuffing !== undefined) {
    if (!isRecord(value.stuffing)) {
      return null;
    }

    if (typeof value.stuffing.notes === "string") {
      production.stuffing = { notes: value.stuffing.notes };
    }
  }

  if (value.resting !== undefined) {
    if (!isRecord(value.resting)) {
      return null;
    }

    const resting: NonNullable<RecipeProduction["resting"]> = {
      durationMin: parseOptionalNumber(value.resting.durationMin),
      notes:
        typeof value.resting.notes === "string"
          ? value.resting.notes
          : undefined,
    };

    if (resting.durationMin !== undefined || resting.notes !== undefined) {
      production.resting = resting;
    }
  }

  return production;
}

/**
 * Parst das Räucherprogramm aus JSON.
 */
function parseSmoking(value: Record<string, unknown>): RecipeSmoking | null {
  const smoking: RecipeSmoking = {};

  if (value.notes !== undefined) {
    if (typeof value.notes !== "string") {
      return null;
    }
    smoking.notes = value.notes;
  }

  if (value.phases !== undefined) {
    if (!Array.isArray(value.phases)) {
      return null;
    }

    const phases: RecipeSmokingPhase[] = [];

    for (const item of value.phases) {
      if (!isRecord(item) || typeof item.name !== "string") {
        return null;
      }

      phases.push({
        name: item.name,
        temperatureC: parseOptionalNumber(item.temperatureC),
        durationMin: parseOptionalNumber(item.durationMin),
        humidityPercent: parseOptionalNumber(item.humidityPercent),
      });
    }

    smoking.phases = phases;
  }

  return smoking;
}

/**
 * Prüft, ob ein Wert eine nicht-leere Zeichenkette ist.
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Parst ein unbekanntes JSON-Objekt in eine MeatClassification.
 *
 * @param value - Rohwert aus JSON
 */
function parseMeatClassification(value: unknown): MeatClassification | null {
  if (!isRecord(value)) {
    return null;
  }

  const keys = [
    "S1",
    "S2",
    "S3",
    "S4",
    "S5",
    "S6",
    "S7",
    "S8",
    "S9",
    "S10",
    "R1",
    "R2",
    "R3",
    "R4",
    "R5",
  ] as const;

  const result = {} as MeatClassification;

  for (const key of keys) {
    if (!isFiniteNumber(value[key])) {
      return null;
    }
    result[key] = value[key];
  }

  return result;
}

/**
 * Parst den vollständigen RecipePayload aus unbekanntem JSON.
 * Gibt `null` zurück, wenn die Struktur nicht dem Typ entspricht.
 *
 * @param value - Roh-JSON (z. B. aus Request-Body oder Prisma)
 */
export function parseRecipePayload(value: unknown): RecipePayload | null {
  if (!isRecord(value)) {
    return null;
  }

  if (!isRecord(value.calculation)) {
    return null;
  }

  if (!isFiniteNumber(value.calculation.totalWeightKg)) {
    return null;
  }

  if (!Array.isArray(value.meats) || !Array.isArray(value.binders)) {
    return null;
  }

  if (!Array.isArray(value.ingredients)) {
    return null;
  }

  const meats = [];

  for (const item of value.meats) {
    if (!isRecord(item)) {
      return null;
    }

    const classification = parseMeatClassification(item.classification);

    if (
      !isNonEmptyString(item.meatType) ||
      !isFiniteNumber(item.percentage) ||
      !classification ||
      !isFiniteNumber(item.sortOrder)
    ) {
      return null;
    }

    meats.push({
      meatType: item.meatType,
      percentage: item.percentage,
      classification,
      sortOrder: item.sortOrder,
    });
  }

  const binders = [];

  for (const item of value.binders) {
    if (!isRecord(item)) {
      return null;
    }

    if (
      !isNonEmptyString(item.binderType) ||
      !isFiniteNumber(item.percentage) ||
      !isFiniteNumber(item.sortOrder)
    ) {
      return null;
    }

    binders.push({
      binderType: item.binderType,
      percentage: item.percentage,
      sortOrder: item.sortOrder,
    });
  }

  const ingredients: RecipePayload["ingredients"] = [];

  for (const item of value.ingredients) {
    if (!isRecord(item)) {
      return null;
    }

    if (
      !isNonEmptyString(item.name) ||
      !isFiniteNumber(item.amountPerKg) ||
      typeof item.referenceBasis !== "string" ||
      !INGREDIENT_BASES.includes(item.referenceBasis as IngredientReferenceBasis) ||
      item.unit !== "g/kg" ||
      !isFiniteNumber(item.sortOrder)
    ) {
      return null;
    }

    let group: IngredientGroup | undefined;

    if (
      item.group === "salz" ||
      item.group === "gewuerze" ||
      item.group === "hilfsstoff" ||
      item.group === "sonstiges"
    ) {
      group = item.group;
    }

    ingredients.push({
      ingredientId:
        typeof item.ingredientId === "string" ? item.ingredientId : undefined,
      name: item.name,
      amountPerKg: item.amountPerKg,
      referenceBasis: item.referenceBasis as IngredientReferenceBasis,
      unit: "g/kg",
      sortOrder: item.sortOrder,
      group,
    });
  }

  const payload: RecipePayload = {
    calculation: {
      totalWeightKg: value.calculation.totalWeightKg,
      meatSharePercent: isFiniteNumber(value.calculation.meatSharePercent)
        ? value.calculation.meatSharePercent
        : undefined,
      binderSharePercent: isFiniteNumber(value.calculation.binderSharePercent)
        ? value.calculation.binderSharePercent
        : undefined,
    },
    meats,
    binders,
    ingredients,
  };

  if (value.schuettung !== undefined) {
    if (!isRecord(value.schuettung)) {
      return null;
    }
    payload.schuettung = {
      waterGPerKg: isFiniteNumber(value.schuettung.waterGPerKg)
        ? value.schuettung.waterGPerKg
        : undefined,
      nitriteMgPerKg: isFiniteNumber(value.schuettung.nitriteMgPerKg)
        ? value.schuettung.nitriteMgPerKg
        : undefined,
      ascorbicMgPerKg: isFiniteNumber(value.schuettung.ascorbicMgPerKg)
        ? value.schuettung.ascorbicMgPerKg
        : undefined,
    };
  }

  if (value.casing !== undefined) {
    if (!isRecord(value.casing) || !isNonEmptyString(value.casing.casingType)) {
      // Ungültige Darmangaben verwerfen — Rest des Payloads bleibt gültig.
    } else {
      payload.casing = {
        casingType: value.casing.casingType,
        caliber:
          typeof value.casing.caliber === "string" &&
          value.casing.caliber.trim()
            ? value.casing.caliber.trim()
            : undefined,
        caliberMm: parseOptionalNumber(value.casing.caliberMm),
        lengthCm: parseOptionalNumber(value.casing.lengthCm),
        notes:
          typeof value.casing.notes === "string" ? value.casing.notes : undefined,
      };

      // Legacy: nur caliberMm vorhanden → als String spiegeln
      if (!payload.casing.caliber && payload.casing.caliberMm !== undefined) {
        payload.casing.caliber = String(payload.casing.caliberMm);
      }

      // Neues Format: caliber setzen, caliberMm aus erstem Wert ableiten
      if (payload.casing.caliber && payload.casing.caliberMm === undefined) {
        const first = parseOptionalNumber(payload.casing.caliber.split("/")[0]);
        if (first !== undefined) {
          payload.casing.caliberMm = first;
        }
      }
    }
  }

  if (value.production !== undefined) {
    if (!isRecord(value.production)) {
      return null;
    }

    const production = parseProduction(value.production);

    if (!production) {
      return null;
    }

    payload.production = production;
  }

  if (value.smoking !== undefined) {
    if (!isRecord(value.smoking)) {
      return null;
    }

    const smoking = parseSmoking(value.smoking);

    if (!smoking) {
      return null;
    }

    payload.smoking = smoking;
  }

  return payload;
}

/**
 * Prüft, ob der Payload fachlich gespeichert werden darf.
 * Leere Entwürfe (kein Gewicht, keine Fleisch-/Schüttungszeilen) sind erlaubt.
 * Sobald Inhalt vorhanden ist, muss `runRecipeCalculation` erfolgreich sein
 * und Fleisch + Schüttung müssen 100 % ergeben.
 *
 * @param payload - Zu validierender Payload
 */
export function validateRecipePayloadForSave(
  payload: RecipePayload,
): RecipeServiceResult<RecipePayload> {
  const hasMeatOrBinder =
    payload.meats.length > 0 || payload.binders.length > 0;
  const hasWeight = payload.calculation.totalWeightKg > 0;

  if (!hasMeatOrBinder && !hasWeight) {
    return { success: true, data: payload };
  }

  const calculation = runRecipeCalculation(payload);

  if ("error" in calculation) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: calculation.error,
    });
  }

  if (hasMeatOrBinder && !calculation.result.sharesValid) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message:
        calculation.result.sharesMessage ??
        "Fleisch und Schüttung müssen zusammen 100 % ergeben.",
      details: {
        meatSharePercent: String(calculation.result.meatSharePercent),
        binderSharePercent: String(calculation.result.binderSharePercent),
      },
    });
  }

  return { success: true, data: payload };
}

/**
 * Liefert den Standard-Payload für neue Entwürfe.
 */
export function getDefaultRecipePayload(): RecipePayload {
  return structuredClone(EMPTY_RECIPE_PAYLOAD);
}

/**
 * Prüft, ob eine Zeichenkette eine gültige UUID ist.
 *
 * @param value - Zu prüfende ID
 */
export function isValidUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
