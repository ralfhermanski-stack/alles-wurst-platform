/**
 * @file recipe-import-export.ts
 * @purpose JSON-Import und -Export für Rezepte des Alles-Wurst Rezeptgenerators.
 */

import { RecipeStatus, RecipeVisibility } from "@prisma/client";

import { parseRecipePayload } from "./recipe-payload-validator";
import type { ApiRecipe } from "./recipe-client";
import type { RecipePayload } from "./recipe-types";

/** Erkennungsmerkmal exportierter Dateien */
export const RECIPE_EXPORT_FORMAT = "alles-wurst-recipe" as const;

/** Version des Exportformats / Rezeptgenerators */
export const RECIPE_GENERATOR_VERSION = "1.0";

/** Struktur einer exportierten Rezept-JSON-Datei */
export type RecipeExportFile = {
  format: typeof RECIPE_EXPORT_FORMAT;
  generatorVersion: string;
  exportedAt: string;
  name: string;
  category: string | null;
  description: string | null;
  version: number;
  payload: RecipePayload;
};

/** Eingabedaten zum Anlegen eines importierten Rezepts */
export type RecipeImportCreateInput = {
  userId: string;
  name: string;
  category: string | null;
  description: string | null;
  payload: RecipePayload;
  status: RecipeStatus;
  visibility: RecipeVisibility;
};

type ImportExportSuccess<T> = { success: true; data: T };
type ImportExportFailure = { success: false; error: string };
export type ImportExportResult<T> = ImportExportSuccess<T> | ImportExportFailure;

/**
 * Prüft, ob ein Wert ein nicht-leeres Objekt ist.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Erzeugt die Exportstruktur aus einem gespeicherten Rezept.
 * Interne DB-Felder werden nicht übernommen.
 */
export function buildRecipeExportFile(recipe: ApiRecipe): RecipeExportFile {
  return {
    format: RECIPE_EXPORT_FORMAT,
    generatorVersion: RECIPE_GENERATOR_VERSION,
    exportedAt: new Date().toISOString(),
    name: recipe.name,
    category: recipe.category,
    description: recipe.description,
    version: recipe.version,
    payload: structuredClone(recipe.payload),
  };
}

/**
 * Bereinigt einen Dateinamen für den Download.
 */
export function buildRecipeExportFilename(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/gi, "-")
    .replace(/^-+|-+$/g, "");

  const safeBase = base.length > 0 ? base : "rezept";

  return `${safeBase}.json`;
}

/**
 * Startet den Download einer Exportdatei im Browser.
 */
export function downloadRecipeExportFile(exportFile: RecipeExportFile): void {
  const json = JSON.stringify(exportFile, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = buildRecipeExportFilename(exportFile.name);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Entfernt fremde Referenzen aus dem importierten Payload.
 */
export function sanitizeImportedPayload(payload: RecipePayload): RecipePayload {
  return {
    ...payload,
    ingredients: payload.ingredients.map((ingredient) => ({
      name: ingredient.name,
      amountPerKg: ingredient.amountPerKg,
      referenceBasis: ingredient.referenceBasis,
      unit: ingredient.unit,
      sortOrder: ingredient.sortOrder,
      group: ingredient.group,
    })),
  };
}

/**
 * Erzeugt den Anzeigenamen für ein importiertes Rezept.
 */
export function buildImportedRecipeName(originalName: string): string {
  const trimmed = originalName.trim();
  const baseName = trimmed.length > 0 ? trimmed : "Rezept";

  if (baseName.endsWith(" (Import)")) {
    return baseName;
  }

  return `${baseName} (Import)`;
}

/**
 * Parst und validiert den Inhalt einer Importdatei.
 */
export function parseRecipeImportFile(
  fileText: string,
): ImportExportResult<RecipeImportCreateInput> {
  let parsed: unknown;

  try {
    parsed = JSON.parse(fileText);
  } catch {
    return {
      success: false,
      error: "Die Datei enthält kein gültiges JSON.",
    };
  }

  if (!isRecord(parsed)) {
    return {
      success: false,
      error: "Die Datei ist keine gültige Rezept-Datei.",
    };
  }

  if (
    parsed.format !== undefined &&
    parsed.format !== RECIPE_EXPORT_FORMAT
  ) {
    return {
      success: false,
      error: "Das Dateiformat wird nicht erkannt.",
    };
  }

  if (typeof parsed.name !== "string") {
    return {
      success: false,
      error: "Der Rezeptname fehlt oder ist ungültig.",
    };
  }

  if (
    parsed.category !== null &&
    parsed.category !== undefined &&
    typeof parsed.category !== "string"
  ) {
    return {
      success: false,
      error: "Die Kategorie in der Datei ist ungültig.",
    };
  }

  if (
    parsed.description !== null &&
    parsed.description !== undefined &&
    typeof parsed.description !== "string"
  ) {
    return {
      success: false,
      error: "Die Beschreibung in der Datei ist ungültig.",
    };
  }

  if (!isRecord(parsed.payload)) {
    return {
      success: false,
      error: "Die Rezeptdaten fehlen oder sind unvollständig.",
    };
  }

  const payload = parseRecipePayload(parsed.payload);

  if (!payload) {
    return {
      success: false,
      error:
        "Die Rezeptdaten sind fehlerhaft oder entsprechen nicht dem erwarteten Aufbau.",
    };
  }

  const sanitizedPayload = sanitizeImportedPayload(payload);

  return {
    success: true,
    data: {
      userId: "",
      name: buildImportedRecipeName(parsed.name),
      category:
        typeof parsed.category === "string" ? parsed.category.trim() || null : null,
      description:
        typeof parsed.description === "string"
          ? parsed.description.trim() || null
          : null,
      payload: sanitizedPayload,
      status: RecipeStatus.draft,
      visibility: RecipeVisibility.private,
    },
  };
}

/**
 * Setzt die userId für den API-Aufruf nach der Dateivalidierung.
 */
export function finalizeRecipeImportInput(
  input: RecipeImportCreateInput,
  userId: string,
): RecipeImportCreateInput {
  return {
    ...input,
    userId,
  };
}
