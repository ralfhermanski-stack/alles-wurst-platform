/**
 * @file admin-settings-service.ts
 * @purpose Globale Einstellungen für den Rezeptgenerator (PDF u. a.).
 */

import { prisma } from "@/lib/db/prisma";
import {
  recipeFailure,
  recipeSuccess,
  type RecipeServiceResult,
} from "@/lib/tools/recipe-errors";

const SETTINGS_ID = "default";

export type RecipeGeneratorSettingsRecord = {
  pdfHeaderText: string;
  pdfFooterText: string;
  pdfLogoPlaceholder: string;
  pdfLegalNotice: string;
  updatedAt: string;
};

export type UpdateRecipeGeneratorSettingsInput = {
  pdfHeaderText?: string;
  pdfFooterText?: string;
  pdfLogoPlaceholder?: string;
  pdfLegalNotice?: string;
};

function mapSettings(row: {
  pdfHeaderText: string;
  pdfFooterText: string;
  pdfLogoPlaceholder: string;
  pdfLegalNotice: string;
  updatedAt: Date;
}): RecipeGeneratorSettingsRecord {
  return {
    pdfHeaderText: row.pdfHeaderText,
    pdfFooterText: row.pdfFooterText,
    pdfLogoPlaceholder: row.pdfLogoPlaceholder,
    pdfLegalNotice: row.pdfLegalNotice,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function handleError(error: unknown): RecipeServiceResult<never> {
  console.error("[admin-settings-service] Unerwarteter Datenbankfehler:", error);

  return recipeFailure({
    code: "INTERNAL_ERROR",
    message: "Ein interner Fehler ist aufgetreten. Bitte später erneut versuchen.",
  });
}

/**
 * Lädt die globalen Rezeptgenerator-Einstellungen (legt Defaults an, falls leer).
 */
export async function getRecipeGeneratorSettings(): Promise<
  RecipeServiceResult<RecipeGeneratorSettingsRecord>
> {
  try {
    const settings = await prisma.recipeGeneratorSettings.upsert({
      where: { id: SETTINGS_ID },
      create: { id: SETTINGS_ID },
      update: {},
    });

    return recipeSuccess(mapSettings(settings));
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Aktualisiert die globalen Rezeptgenerator-Einstellungen.
 */
export async function updateRecipeGeneratorSettings(
  input: UpdateRecipeGeneratorSettingsInput,
): Promise<RecipeServiceResult<RecipeGeneratorSettingsRecord>> {
  const data: UpdateRecipeGeneratorSettingsInput = {};

  if (input.pdfHeaderText !== undefined) {
    const value = input.pdfHeaderText.trim();

    if (!value) {
      return recipeFailure({
        code: "VALIDATION_ERROR",
        message: "Der PDF-Headertext darf nicht leer sein.",
      });
    }

    data.pdfHeaderText = value;
  }

  if (input.pdfFooterText !== undefined) {
    const value = input.pdfFooterText.trim();

    if (!value) {
      return recipeFailure({
        code: "VALIDATION_ERROR",
        message: "Der PDF-Footertext darf nicht leer sein.",
      });
    }

    data.pdfFooterText = value;
  }

  if (input.pdfLogoPlaceholder !== undefined) {
    const value = input.pdfLogoPlaceholder.trim();

    if (!value) {
      return recipeFailure({
        code: "VALIDATION_ERROR",
        message: "Der Logo-Platzhalter darf nicht leer sein.",
      });
    }

    data.pdfLogoPlaceholder = value;
  }

  if (input.pdfLegalNotice !== undefined) {
    data.pdfLegalNotice = input.pdfLegalNotice.trim();
  }

  try {
    const settings = await prisma.recipeGeneratorSettings.upsert({
      where: { id: SETTINGS_ID },
      create: {
        id: SETTINGS_ID,
        ...data,
      },
      update: data,
    });

    return recipeSuccess(mapSettings(settings));
  } catch (error) {
    return handleError(error);
  }
}
