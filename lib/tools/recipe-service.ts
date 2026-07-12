/**
 * @file recipe-service.ts
 * @purpose Serverseitige CRUD- und Geschäftslogik für Rezepte (Rezeptgenerator).
 * @responsibility Prisma-Zugriff, Validierung, Berechtigungen — keine UI.
 * @usage Importiert von API-Routen unter `app/api/tools/recipes/`.
 * @see docs/REZEPTGENERATOR_DATENMODELL.md (Version 1.1)
 */

import {
  Prisma,
  type Recipe,
  RecipeStatus,
  RecipeVisibility,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  canCreateOwnRecipe,
  type MembershipAccessContext,
} from "@/lib/membership/membership-rules";
import { guardMembershipCheck } from "@/lib/membership/membership-guard";
import {
  sumBinderPercent,
  sumMeatPercent,
} from "./recipe-calculator";
import {
  recipeFailure,
  recipeSuccess,
  type RecipeServiceResult,
} from "./recipe-errors";
import {
  getDefaultRecipePayload,
  isValidUuid,
  parseRecipePayload,
  validateRecipePayloadForSave,
} from "./recipe-payload-validator";
import type { RecipePayload } from "./recipe-types";

// =============================================================================
// Öffentliche Typen
// =============================================================================

/** Serialisiertes Rezept für API-Antworten */
export type RecipeRecord = {
  id: string;
  userId: string;
  name: string;
  category: string | null;
  description: string | null;
  status: RecipeStatus;
  visibility: RecipeVisibility;
  totalWeightKg: number | null;
  payload: RecipePayload;
  version: number;
  publishedAt: string | null;
  hasImage: boolean;
  imageFileName: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

/** Eingabe beim Anlegen eines Rezepts */
export type CreateRecipeInput = {
  userId: string;
  name: string;
  category?: string | null;
  description?: string | null;
  payload?: RecipePayload;
  status?: RecipeStatus;
  visibility?: RecipeVisibility;
  /** Mitgliedschaftskontext für Limit-Prüfung */
  membership?: MembershipAccessContext;
};

/** Eingabe beim Aktualisieren eines Rezepts */
export type UpdateRecipeInput = {
  userId: string;
  name?: string;
  category?: string | null;
  description?: string | null;
  payload?: RecipePayload;
};

/** Filter für Rezeptlisten */
export type ListRecipesInput = {
  userId: string;
  /** Nur eigene Rezepte (Standard) oder zusätzlich öffentliche fremde */
  includePublic?: boolean;
};

// =============================================================================
// Hilfsfunktionen — Mapping und Berechtigungen
// =============================================================================

/**
 * Wandelt eine Prisma-Recipe-Zeile in ein API-taugliches Objekt um.
 *
 * @param recipe - Datenbankzeile
 */
export function mapRecipeToRecord(recipe: Recipe): RecipeRecord {
  const parsedPayload = parseRecipePayload(recipe.payload);

  return {
    id: recipe.id,
    userId: recipe.userId,
    name: recipe.name,
    category: recipe.category,
    description: recipe.description,
    status: recipe.status,
    visibility: recipe.visibility,
    totalWeightKg:
      recipe.totalWeightKg !== null
        ? Number(recipe.totalWeightKg)
        : null,
    payload: parsedPayload ?? getDefaultRecipePayload(),
    version: recipe.version,
    publishedAt: recipe.publishedAt?.toISOString() ?? null,
    hasImage: Boolean(recipe.imageStorageKey),
    imageFileName: recipe.imageFileName,
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
    deletedAt: recipe.deletedAt?.toISOString() ?? null,
  };
}

/**
 * Prüft, ob ein Nutzer ein Rezept lesen darf.
 * - Eigene Rezepte: immer (außer soft-deleted für Nicht-Besitzer)
 * - Fremde Rezepte: nur bei visibility public oder database
 *
 * @param recipe         - Rezeptzeile
 * @param requestingUserId - Anfragender Nutzer
 */
export function canReadRecipe(
  recipe: Recipe,
  requestingUserId: string,
): boolean {
  if (recipe.deletedAt !== null && recipe.userId !== requestingUserId) {
    return false;
  }

  if (recipe.userId === requestingUserId) {
    return true;
  }

  return (
    recipe.visibility === RecipeVisibility.public ||
    recipe.visibility === RecipeVisibility.database
  );
}

/**
 * Prüft, ob ein Nutzer ein Rezept bearbeiten oder löschen darf.
 * Nur der Besitzer — unabhängig von visibility.
 *
 * @param recipe             - Rezeptzeile
 * @param requestingUserId   - Anfragender Nutzer
 */
export function canWriteRecipe(
  recipe: Recipe,
  requestingUserId: string,
): boolean {
  if (recipe.deletedAt !== null) {
    return false;
  }

  return recipe.userId === requestingUserId;
}

/**
 * Validiert die userId und gibt einen strukturierten Fehler zurück.
 *
 * @param userId - Nutzer-ID aus Request
 */
function validateUserId(userId: string): RecipeServiceResult<string> {
  if (!userId.trim()) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Die userId ist erforderlich.",
    });
  }

  if (!isValidUuid(userId)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Die userId muss eine gültige UUID sein.",
    });
  }

  return recipeSuccess(userId);
}

/**
 * Bereitet den Payload vor dem Speichern auf:
 * - Prozent-Summen in calculation synchronisieren
 * - totalWeightKg für die Tabellenspalte ableiten
 *
 * @param payload - Validieter Payload
 */
function preparePayloadForStorage(payload: RecipePayload): {
  payload: RecipePayload;
  totalWeightKg: number | null;
} {
  const enriched: RecipePayload = {
    ...payload,
    calculation: {
      ...payload.calculation,
      meatSharePercent: sumMeatPercent(payload.meats),
      binderSharePercent: sumBinderPercent(payload.binders),
    },
  };

  const totalWeightKg =
    enriched.calculation.totalWeightKg > 0
      ? enriched.calculation.totalWeightKg
      : null;

  return { payload: enriched, totalWeightKg };
}

/**
 * Mappt unbekannte Prisma-Fehler auf strukturierte Service-Fehler.
 *
 * @param error - Abgefangener Fehler
 */
function handlePrismaError(error: unknown): RecipeServiceResult<never> {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Das Rezept wurde nicht gefunden.",
      });
    }
  }

  console.error("[recipe-service] Unerwarteter Datenbankfehler:", error);

  return recipeFailure({
    code: "INTERNAL_ERROR",
    message: "Ein interner Fehler ist aufgetreten. Bitte später erneut versuchen.",
  });
}

/**
 * Validiert den Rezeptnamen.
 *
 * @param name - Rezeptname
 */
function validateRecipeName(name: string): RecipeServiceResult<string> {
  const trimmed = name.trim();

  if (!trimmed) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Der Rezeptname ist erforderlich.",
    });
  }

  if (trimmed.length > 200) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Der Rezeptname darf maximal 200 Zeichen lang sein.",
    });
  }

  return recipeSuccess(trimmed);
}

/**
 * Ermittelt publishedAt bei Status- oder Sichtbarkeitsänderung.
 *
 * @param status     - Neuer oder aktueller Status
 * @param visibility - Neue oder aktuelle Sichtbarkeit
 * @param existing   - Bisheriger publishedAt-Wert
 */
function resolvePublishedAt(
  status: RecipeStatus,
  visibility: RecipeVisibility,
  existing: Date | null,
): Date | null {
  if (
    status === RecipeStatus.published ||
    visibility === RecipeVisibility.database
  ) {
    return existing ?? new Date();
  }

  return existing;
}

// =============================================================================
// CRUD-Operationen
// =============================================================================

/**
 * Zählt aktive eigene Rezepte eines Nutzers.
 */
export async function countUserRecipes(userId: string): Promise<number> {
  return prisma.recipe.count({
    where: {
      userId,
      deletedAt: null,
      recipeKind: "wurst",
    },
  });
}

/**
 * Legt ein neues Rezept an.
 *
 * @param input - Erstellungsdaten inkl. userId
 */
export async function createRecipe(
  input: CreateRecipeInput,
): Promise<RecipeServiceResult<RecipeRecord>> {
  const userResult = validateUserId(input.userId);

  if (!userResult.success) {
    return userResult;
  }

  const nameResult = validateRecipeName(input.name);

  if (!nameResult.success) {
    return nameResult;
  }

  if (input.membership) {
    const currentCount = await countUserRecipes(input.userId);
    const createCheck = canCreateOwnRecipe(input.membership, currentCount);
    const membershipGuard = guardMembershipCheck(createCheck);

    if (membershipGuard) {
      return membershipGuard;
    }
  }

  const payload = input.payload ?? getDefaultRecipePayload();
  const payloadValidation = validateRecipePayloadForSave(payload);

  if (!payloadValidation.success) {
    return payloadValidation;
  }

  const prepared = preparePayloadForStorage(payloadValidation.data);
  const status = input.status ?? RecipeStatus.draft;
  const visibility = input.visibility ?? RecipeVisibility.private;

  try {
    const recipe = await prisma.recipe.create({
      data: {
        userId: input.userId,
        name: nameResult.data,
        category: input.category ?? null,
        description: input.description ?? null,
        status,
        visibility,
        totalWeightKg: prepared.totalWeightKg,
        payload: prepared.payload as Prisma.InputJsonValue,
        version: 1,
        recipeKind: "wurst",
        source: "USER",
        publishedAt: resolvePublishedAt(status, visibility, null),
      },
    });

    return recipeSuccess(mapRecipeToRecord(recipe));
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Liest ein einzelnes Rezept anhand der ID.
 *
 * @param recipeId         - Rezept-UUID
 * @param requestingUserId - Anfragender Nutzer
 */
export async function getRecipeById(
  recipeId: string,
  requestingUserId: string,
): Promise<RecipeServiceResult<RecipeRecord>> {
  const userResult = validateUserId(requestingUserId);

  if (!userResult.success) {
    return userResult;
  }

  if (!isValidUuid(recipeId)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Die Rezept-ID muss eine gültige UUID sein.",
    });
  }

  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!recipe) {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Das Rezept wurde nicht gefunden.",
      });
    }

    if (!canReadRecipe(recipe, requestingUserId)) {
      return recipeFailure({
        code: "FORBIDDEN",
        message: "Du hast keine Berechtigung, dieses Rezept zu lesen.",
      });
    }

    return recipeSuccess(mapRecipeToRecord(recipe));
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Listet Rezepte für einen Nutzer.
 * Standard: nur eigene, nicht gelöschte Rezepte.
 * Mit includePublic: zusätzlich fremde public/database-Rezepte.
 *
 * @param input - Listenfilter inkl. userId
 */
export async function listRecipes(
  input: ListRecipesInput,
): Promise<RecipeServiceResult<RecipeRecord[]>> {
  const userResult = validateUserId(input.userId);

  if (!userResult.success) {
    return userResult;
  }

  try {
    const ownRecipes = await prisma.recipe.findMany({
      where: {
        userId: input.userId,
        deletedAt: null,
        recipeKind: "wurst",
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!input.includePublic) {
      return recipeSuccess(ownRecipes.map(mapRecipeToRecord));
    }

    const publicRecipes = await prisma.recipe.findMany({
      where: {
        userId: { not: input.userId },
        deletedAt: null,
        recipeKind: "wurst",
        visibility: {
          in: [RecipeVisibility.public, RecipeVisibility.database],
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const combined = [...ownRecipes, ...publicRecipes];

    return recipeSuccess(combined.map(mapRecipeToRecord));
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Aktualisiert Stammdaten und/oder Payload eines Rezepts.
 * Erhöht version bei inhaltlichen Änderungen.
 *
 * @param recipeId - Rezept-UUID
 * @param input    - Änderungen inkl. userId
 */
export async function updateRecipe(
  recipeId: string,
  input: UpdateRecipeInput,
): Promise<RecipeServiceResult<RecipeRecord>> {
  const userResult = validateUserId(input.userId);

  if (!userResult.success) {
    return userResult;
  }

  if (!isValidUuid(recipeId)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Die Rezept-ID muss eine gültige UUID sein.",
    });
  }

  try {
    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!existing) {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Das Rezept wurde nicht gefunden.",
      });
    }

    if (!canWriteRecipe(existing, input.userId)) {
      return recipeFailure({
        code: "FORBIDDEN",
        message: "Du hast keine Berechtigung, dieses Rezept zu bearbeiten.",
      });
    }

    const data: Prisma.RecipeUpdateInput = {};
    let incrementVersion = false;

    if (input.name !== undefined) {
      const nameResult = validateRecipeName(input.name);

      if (!nameResult.success) {
        return nameResult;
      }

      data.name = nameResult.data;
      incrementVersion = true;
    }

    if (input.category !== undefined) {
      data.category = input.category;
      incrementVersion = true;
    }

    if (input.description !== undefined) {
      data.description = input.description;
      incrementVersion = true;
    }

    if (input.payload !== undefined) {
      const payloadValidation = validateRecipePayloadForSave(input.payload);

      if (!payloadValidation.success) {
        return payloadValidation;
      }

      const prepared = preparePayloadForStorage(payloadValidation.data);
      data.payload = prepared.payload as Prisma.InputJsonValue;
      data.totalWeightKg = prepared.totalWeightKg;
      incrementVersion = true;
    }

    if (incrementVersion) {
      data.version = { increment: 1 };
    }

    const recipe = await prisma.recipe.update({
      where: { id: recipeId },
      data,
    });

    return recipeSuccess(mapRecipeToRecord(recipe));
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Löscht ein Rezept (Soft-Delete via deletedAt).
 *
 * @param recipeId         - Rezept-UUID
 * @param requestingUserId - Anfragender Nutzer
 */
export async function deleteRecipe(
  recipeId: string,
  requestingUserId: string,
): Promise<RecipeServiceResult<{ id: string; deletedAt: string }>> {
  const userResult = validateUserId(requestingUserId);

  if (!userResult.success) {
    return userResult;
  }

  if (!isValidUuid(recipeId)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Die Rezept-ID muss eine gültige UUID sein.",
    });
  }

  try {
    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!existing) {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Das Rezept wurde nicht gefunden.",
      });
    }

    if (!canWriteRecipe(existing, requestingUserId)) {
      return recipeFailure({
        code: "FORBIDDEN",
        message: "Du hast keine Berechtigung, dieses Rezept zu löschen.",
      });
    }

    const deletedAt = new Date();

    await prisma.recipe.update({
      where: { id: recipeId },
      data: { deletedAt },
    });

    return recipeSuccess({
      id: recipeId,
      deletedAt: deletedAt.toISOString(),
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Dupliziert ein Rezept für denselben Nutzer.
 * Die Kopie startet als Entwurf mit visibility private und version 1.
 *
 * @param recipeId         - Quell-Rezept-UUID
 * @param requestingUserId - Nutzer, der die Kopie erhält
 */
export async function duplicateRecipe(
  recipeId: string,
  requestingUserId: string,
  membership?: MembershipAccessContext,
): Promise<RecipeServiceResult<RecipeRecord>> {
  const userResult = validateUserId(requestingUserId);

  if (!userResult.success) {
    return userResult;
  }

  if (!isValidUuid(recipeId)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Die Rezept-ID muss eine gültige UUID sein.",
    });
  }

  try {
    const source = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!source) {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Das Rezept wurde nicht gefunden.",
      });
    }

    if (!canReadRecipe(source, requestingUserId)) {
      return recipeFailure({
        code: "FORBIDDEN",
        message: "Du hast keine Berechtigung, dieses Rezept zu kopieren.",
      });
    }

    if (membership) {
      const currentCount = await countUserRecipes(requestingUserId);
      const createCheck = canCreateOwnRecipe(membership, currentCount);
      const membershipGuard = guardMembershipCheck(createCheck);

      if (membershipGuard) {
        return membershipGuard;
      }
    }

    const sourcePayload =
      parseRecipePayload(source.payload) ?? getDefaultRecipePayload();

    const copy = await prisma.recipe.create({
      data: {
        userId: requestingUserId,
        name: `${source.name} (Kopie)`,
        category: source.category,
        description: source.description,
        status: RecipeStatus.draft,
        visibility: RecipeVisibility.private,
        totalWeightKg: source.totalWeightKg,
        payload: sourcePayload as Prisma.InputJsonValue,
        version: 1,
        source: "USER",
        publishedAt: null,
      },
    });

    return recipeSuccess(mapRecipeToRecord(copy));
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Ändert den Status eines Rezepts (draft | saved | published).
 *
 * @param recipeId         - Rezept-UUID
 * @param requestingUserId - Anfragender Nutzer
 * @param status           - Neuer Status
 */
export async function updateRecipeStatus(
  recipeId: string,
  requestingUserId: string,
  status: RecipeStatus,
): Promise<RecipeServiceResult<RecipeRecord>> {
  const userResult = validateUserId(requestingUserId);

  if (!userResult.success) {
    return userResult;
  }

  if (!isValidUuid(recipeId)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Die Rezept-ID muss eine gültige UUID sein.",
    });
  }

  const allowedStatuses: RecipeStatus[] = [
    RecipeStatus.draft,
    RecipeStatus.saved,
    RecipeStatus.published,
  ];

  if (!allowedStatuses.includes(status)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Ungültiger Status. Erlaubt: draft, saved, published.",
    });
  }

  try {
    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!existing) {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Das Rezept wurde nicht gefunden.",
      });
    }

    if (!canWriteRecipe(existing, requestingUserId)) {
      return recipeFailure({
        code: "FORBIDDEN",
        message: "Du hast keine Berechtigung, den Status zu ändern.",
      });
    }

    const recipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        status,
        publishedAt: resolvePublishedAt(
          status,
          existing.visibility,
          existing.publishedAt,
        ),
      },
    });

    return recipeSuccess(mapRecipeToRecord(recipe));
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Ändert die Sichtbarkeit eines Rezepts (private | public | database).
 *
 * @param recipeId         - Rezept-UUID
 * @param requestingUserId - Anfragender Nutzer
 * @param visibility       - Neue Sichtbarkeit
 */
export async function updateRecipeVisibility(
  recipeId: string,
  requestingUserId: string,
  visibility: RecipeVisibility,
): Promise<RecipeServiceResult<RecipeRecord>> {
  const userResult = validateUserId(requestingUserId);

  if (!userResult.success) {
    return userResult;
  }

  if (!isValidUuid(recipeId)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Die Rezept-ID muss eine gültige UUID sein.",
    });
  }

  const allowedVisibilities: RecipeVisibility[] = [
    RecipeVisibility.private,
    RecipeVisibility.public,
    RecipeVisibility.database,
  ];

  if (!allowedVisibilities.includes(visibility)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Ungültige Sichtbarkeit. Erlaubt: private, public, database.",
    });
  }

  try {
    const existing = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!existing) {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Das Rezept wurde nicht gefunden.",
      });
    }

    if (!canWriteRecipe(existing, requestingUserId)) {
      return recipeFailure({
        code: "FORBIDDEN",
        message: "Du hast keine Berechtigung, die Sichtbarkeit zu ändern.",
      });
    }

    const recipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: {
        visibility,
        publishedAt: resolvePublishedAt(
          existing.status,
          visibility,
          existing.publishedAt,
        ),
      },
    });

    return recipeSuccess(mapRecipeToRecord(recipe));
  } catch (error) {
    return handlePrismaError(error);
  }
}
