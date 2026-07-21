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
import {
  deleteRecipePdfLogoFile,
  getRecipePdfLogoPublicUrl,
  saveRecipePdfLogo,
} from "@/lib/tools/recipe-pdf-logo-storage";

const SETTINGS_ID = "default";

export type RecipeGeneratorSettingsRecord = {
  pdfHeaderText: string;
  pdfFooterText: string;
  pdfLogoPlaceholder: string;
  pdfLogoUrl: string | null;
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
  pdfLogoStorageKey: string | null;
  pdfLegalNotice: string;
  updatedAt: Date;
}): RecipeGeneratorSettingsRecord {
  return {
    pdfHeaderText: row.pdfHeaderText,
    pdfFooterText: row.pdfFooterText,
    pdfLogoPlaceholder: row.pdfLogoPlaceholder,
    pdfLogoUrl: row.pdfLogoStorageKey ? getRecipePdfLogoPublicUrl() : null,
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

async function ensureSettings() {
  return prisma.recipeGeneratorSettings.upsert({
    where: { id: SETTINGS_ID },
    create: { id: SETTINGS_ID },
    update: {},
  });
}

/**
 * Lädt die globalen Rezeptgenerator-Einstellungen (legt Defaults an, falls leer).
 */
export async function getRecipeGeneratorSettings(): Promise<
  RecipeServiceResult<RecipeGeneratorSettingsRecord>
> {
  try {
    const settings = await ensureSettings();
    return recipeSuccess(mapSettings(settings));
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Metadaten für die öffentliche Logo-Auslieferung.
 */
export async function getRecipePdfLogoMeta(): Promise<{
  storageKey: string;
  mimeType: string;
} | null> {
  const row = await ensureSettings();

  if (!row.pdfLogoStorageKey || !row.pdfLogoMimeType) {
    return null;
  }

  return {
    storageKey: row.pdfLogoStorageKey,
    mimeType: row.pdfLogoMimeType,
  };
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

/**
 * Speichert ein neues PDF-Logo und ersetzt ggf. das bisherige.
 */
export async function uploadRecipePdfLogo(
  fileName: string,
  mimeType: string,
  bytes: Uint8Array,
): Promise<RecipeServiceResult<RecipeGeneratorSettingsRecord>> {
  try {
    const existing = await ensureSettings();
    const saved = await saveRecipePdfLogo(fileName, mimeType, bytes);

    const settings = await prisma.recipeGeneratorSettings.update({
      where: { id: SETTINGS_ID },
      data: {
        pdfLogoStorageKey: saved.storageKey,
        pdfLogoFileName: saved.fileName,
        pdfLogoMimeType: saved.mimeType,
      },
    });

    await deleteRecipePdfLogoFile(existing.pdfLogoStorageKey);

    return recipeSuccess(mapSettings(settings));
  } catch (error) {
    if (error instanceof Error && error.message.includes("erlaubt")) {
      return recipeFailure({
        code: "VALIDATION_ERROR",
        message: error.message,
      });
    }

    if (error instanceof Error && error.message.includes("MB")) {
      return recipeFailure({
        code: "VALIDATION_ERROR",
        message: error.message,
      });
    }

    return handleError(error);
  }
}

/**
 * Entfernt das PDF-Logo.
 */
export async function removeRecipePdfLogo(): Promise<
  RecipeServiceResult<RecipeGeneratorSettingsRecord>
> {
  try {
    const existing = await ensureSettings();

    const settings = await prisma.recipeGeneratorSettings.update({
      where: { id: SETTINGS_ID },
      data: {
        pdfLogoStorageKey: null,
        pdfLogoFileName: null,
        pdfLogoMimeType: null,
      },
    });

    await deleteRecipePdfLogoFile(existing.pdfLogoStorageKey);

    return recipeSuccess(mapSettings(settings));
  } catch (error) {
    return handleError(error);
  }
}
