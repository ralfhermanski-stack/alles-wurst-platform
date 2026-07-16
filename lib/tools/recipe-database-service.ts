/**
 * @file recipe-database-service.ts
 * @purpose Öffentliche Rezeptdatenbank — nur offizielle, freigegebene Rezepte.
 */

import {
  Prisma,
  RecipeStatus,
  RecipeVisibility,
  type Recipe,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { hasActiveCourseAccess } from "@/lib/courses/course-access-service";
import {
  checkMembershipCapability,
  type MembershipAccessContext,
} from "@/lib/membership/membership-rules";
import { guardMembershipCheck } from "@/lib/membership/membership-guard";
import {
  recipeFailure,
  recipeSuccess,
  type RecipeServiceResult,
} from "@/lib/tools/recipe-errors";
import {
  getDefaultRecipePayload,
  isValidUuid,
  parseRecipePayload,
} from "@/lib/tools/recipe-payload-validator";
import { countUserRecipes, mapRecipeToRecord } from "@/lib/tools/recipe-service";
import { canCreateOwnRecipe } from "@/lib/membership/membership-rules";
import type { RecipePayload } from "@/lib/tools/recipe-types";

/** Filter für Rezepttyp (abgeleitet aus dem Payload) */
export type RecipeDatabaseTypeFilter = "all" | "smoked" | "fresh";

/** Filter für die öffentliche Rezeptliste */
export type ListOfficialRecipesInput = {
  category?: string;
  search?: string;
  recipeType?: RecipeDatabaseTypeFilter;
  membership?: MembershipAccessContext;
};

/** Kurzdarstellung für die Rezeptdatenbank-Liste */
export type PublicRecipeSummary = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  totalWeightKg: number | null;
  version: number;
  publishedAt: string | null;
  recipeType: "smoked" | "fresh";
  meatLineCount: number;
  ingredientCount: number;
};

/** Vollständige öffentliche Detailansicht */
export type PublicRecipeDetail = PublicRecipeSummary & {
  payload: RecipePayload;
};

const RECIPE_DB_BASE_WHERE: Prisma.RecipeWhereInput = {
  deletedAt: null,
  status: RecipeStatus.published,
  recipeKind: "wurst",
};

const FLEISCHERMEISTER_RALF_PUBLIC_NAME = "Fleischermeister_Ralf";

let cachedRalfUserId: string | null | undefined = undefined;

async function resolveRalfUserId(): Promise<string | null> {
  if (cachedRalfUserId !== undefined) {
    return cachedRalfUserId;
  }

  const profile = await prisma.userProfile.findUnique({
    where: { publicName: FLEISCHERMEISTER_RALF_PUBLIC_NAME },
    select: { userId: true },
  });

  cachedRalfUserId = profile?.userId ?? null;
  return cachedRalfUserId;
}

function handlePrismaError(error: unknown): RecipeServiceResult<never> {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Das Rezept wurde nicht gefunden.",
      });
    }
  }

  console.error("[recipe-database-service] Unerwarteter Datenbankfehler:", error);

  return recipeFailure({
    code: "INTERNAL_ERROR",
    message: "Ein interner Fehler ist aufgetreten. Bitte später erneut versuchen.",
  });
}

/**
 * Leitet den Rezepttyp aus dem Payload ab (Räucherware vs. Frischware).
 */
export function deriveRecipeType(payload: RecipePayload): "smoked" | "fresh" {
  const smoking = payload.smoking;
  const hasSmoking =
    (smoking?.phases?.length ?? 0) > 0 ||
    Boolean(smoking?.notes?.trim());

  return hasSmoking ? "smoked" : "fresh";
}

function mapToPublicSummary(recipe: Recipe): PublicRecipeSummary {
  const payload = parseRecipePayload(recipe.payload) ?? getDefaultRecipePayload();

  return {
    id: recipe.id,
    name: recipe.name,
    category: recipe.category,
    description: recipe.description,
    totalWeightKg:
      recipe.totalWeightKg !== null ? Number(recipe.totalWeightKg) : null,
    version: recipe.version,
    publishedAt: recipe.publishedAt?.toISOString() ?? null,
    recipeType: deriveRecipeType(payload),
    meatLineCount: payload.meats.length,
    ingredientCount: payload.ingredients.length,
  };
}

function matchesRecipeTypeFilter(
  recipeType: "smoked" | "fresh",
  filter: RecipeDatabaseTypeFilter | undefined,
): boolean {
  if (!filter || filter === "all") {
    return true;
  }

  return recipeType === filter;
}

async function isCourseLinkedRecipeUnlockedForUser(
  args: { recipeId: string; userId: string },
): Promise<boolean> {
  const courseLessons = await prisma.courseLesson.findMany({
    where: {
      lessonType: "recipe",
      recipeId: args.recipeId,
    },
    select: {
      module: { select: { courseId: true } },
    },
  });

  const courseIds = Array.from(
    new Set(courseLessons.map((l) => l.module.courseId)),
  );

  if (courseIds.length === 0) {
    return false;
  }

  for (const courseId of courseIds) {
    const allowed = await hasActiveCourseAccess(args.userId, courseId);
    if (allowed) {
      return true;
    }
  }

  return false;
}

function canRecipeBeVisibleInDatabaseBase(args: {
  recipe: Recipe;
  role: MembershipAccessContext["role"];
  ralfUserId: string | null;
}): boolean {
  const { recipe, role, ralfUserId } = args;

  if (recipe.deletedAt !== null || recipe.status !== RecipeStatus.published) {
    return false;
  }

  const isMonthly = recipe.isRecipeOfMonth === true;
  if (isMonthly) {
    return recipe.visibility === RecipeVisibility.database;
  }

  const isRalfRecipe =
    ralfUserId !== null &&
    recipe.userId === ralfUserId &&
    (recipe.visibility === RecipeVisibility.database ||
      recipe.visibility === RecipeVisibility.public);

  switch (role) {
    case "registered":
      return false; // registered only sees monthly (handled above)
    case "wurstclub":
      return isRalfRecipe;
    case "meisterclub":
    case "admin": {
      const isPublic = recipe.visibility === RecipeVisibility.public;
      const isSpecial =
        recipe.isMeisterclubSpecial === true &&
        (recipe.visibility === RecipeVisibility.database ||
          recipe.visibility === RecipeVisibility.public);
      return isRalfRecipe || isPublic || isSpecial;
    }
    default:
      return false;
  }
}

async function canCourseLockedRecipeBeVisibleForUser(args: {
  recipe: Recipe;
  membership: MembershipAccessContext;
  ralfUserId: string | null;
}): Promise<boolean> {
  const { recipe, membership } = args;

  // Monatsrezept hat Vorrang (immer sichtbar).
  if (recipe.isRecipeOfMonth) {
    return recipe.visibility === RecipeVisibility.database;
  }

  if (!recipe.isCourseLinked) {
    return canRecipeBeVisibleInDatabaseBase({
      recipe,
      role: membership.role,
      ralfUserId: args.ralfUserId,
    });
  }

  // Kurs-locked: nur sichtbar, wenn der User Zugriff auf mindestens einen
  // Kurs hat, in dem dieses Rezept als Lesson-Rezept genutzt wird.
  if (!membership.userId) {
    return false;
  }

  return (
    canRecipeBeVisibleInDatabaseBase({
      recipe,
      role: membership.role,
      ralfUserId: args.ralfUserId,
    }) && (await isCourseLinkedRecipeUnlockedForUser({ recipeId: recipe.id, userId: membership.userId }))
  );
}

/**
 * Listet Rezepte für die öffentliche Rezeptdatenbank (nach Stufe + Kurs-Freigabe).
 */
export async function listOfficialRecipes(
  input: ListOfficialRecipesInput = {},
): Promise<RecipeServiceResult<PublicRecipeSummary[]>> {
  if (input.membership) {
    const readCheck = checkMembershipCapability(
      input.membership,
      "recipe.database.read",
    );
    const guard = guardMembershipCheck(readCheck);

    if (guard) {
      return guard;
    }
  }

  const membership = input.membership;
  const role = membership?.role ?? "guest";
  const userId = membership?.userId ?? null;

  try {
    const ralfUserId =
      role === "wurstclub" || role === "meisterclub" || role === "admin"
        ? await resolveRalfUserId()
        : null;

    const accessOr: Prisma.RecipeWhereInput[] = [];

    // Monatsrezept ist für registrierte sichtbar.
    if (role === "registered") {
      accessOr.push({
        isRecipeOfMonth: true,
        visibility: RecipeVisibility.database,
      });
    } else {
      // Höhere Stufen: Monatsrezept + (Ralf / public / special)
      accessOr.push({
        isRecipeOfMonth: true,
        visibility: RecipeVisibility.database,
      });

      if (ralfUserId) {
        accessOr.push({
          userId: ralfUserId,
          visibility: { in: [RecipeVisibility.database, RecipeVisibility.public] },
        });
      }

      if (role === "meisterclub" || role === "admin") {
        accessOr.push({ visibility: RecipeVisibility.public });
        accessOr.push({ isMeisterclubSpecial: true });
      }
    }

    const and: Prisma.RecipeWhereInput[] = [{ OR: accessOr }];

    if (input.category?.trim()) {
      and.push({
        category: {
          equals: input.category.trim(),
          mode: "insensitive",
        },
      });
    }

    if (input.search?.trim()) {
      const term = input.search.trim();
      and.push({
        OR: [
          { name: { contains: term, mode: "insensitive" } },
          { description: { contains: term, mode: "insensitive" } },
        ],
      });
    }

    const recipes = await prisma.recipe.findMany({
      where: {
        ...RECIPE_DB_BASE_WHERE,
        AND: and,
      },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    });

    // Kurs-locked Rezepte filtern (nur für Club-Stufen, nicht für registriert).
    let finalRecipes = recipes;
    if (
      (role === "wurstclub" || role === "meisterclub" || role === "admin") &&
      recipes.length > 0
    ) {
      const locked = recipes.filter(
        (r) => r.isCourseLinked && !r.isRecipeOfMonth,
      );

      if (locked.length === 0) {
        finalRecipes = recipes;
      } else if (!userId) {
        finalRecipes = recipes.filter((r) => !r.isCourseLinked || r.isRecipeOfMonth);
      } else {
        const lockedIds = locked.map((r) => r.id);

        const courseLessons = await prisma.courseLesson.findMany({
          where: {
            lessonType: "recipe",
            recipeId: { in: lockedIds },
          },
          select: {
            recipeId: true,
            module: { select: { courseId: true } },
          },
        });

        const courseIdsPerRecipe = new Map<string, Set<string>>();
        for (const lesson of courseLessons) {
          if (!lesson.recipeId) {
            continue;
          }
          const set = courseIdsPerRecipe.get(lesson.recipeId) ?? new Set<string>();
          set.add(lesson.module.courseId);
          courseIdsPerRecipe.set(lesson.recipeId, set);
        }

        const uniqueCourseIds = new Set<string>();
        for (const set of courseIdsPerRecipe.values()) {
          for (const courseId of set) {
            uniqueCourseIds.add(courseId);
          }
        }

        const allowedCourseIds = new Map<string, boolean>();
        for (const courseId of uniqueCourseIds) {
          allowedCourseIds.set(courseId, await hasActiveCourseAccess(userId, courseId));
        }

        const unlockedRecipeIds = new Set<string>();
        for (const [rid, courseIdSet] of courseIdsPerRecipe.entries()) {
          const ok = Array.from(courseIdSet).some((cid) => allowedCourseIds.get(cid) === true);
          if (ok) {
            unlockedRecipeIds.add(rid);
          }
        }

        finalRecipes = recipes.filter(
          (r) =>
            !r.isCourseLinked ||
            r.isRecipeOfMonth ||
            unlockedRecipeIds.has(r.id),
        );
      }
    }

    const summaries = finalRecipes
      .map(mapToPublicSummary)
      .filter((summary) =>
        matchesRecipeTypeFilter(summary.recipeType, input.recipeType),
      );

    return recipeSuccess(summaries);
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Lädt ein Rezept für die Detailseite (nach Stufe + Kurs-Freigabe).
 */
export async function getOfficialRecipeById(
  recipeId: string,
  membership?: MembershipAccessContext,
): Promise<RecipeServiceResult<PublicRecipeDetail>> {
  if (membership) {
    const readCheck = checkMembershipCapability(
      membership,
      "recipe.database.read",
    );
    const guard = guardMembershipCheck(readCheck);

    if (guard) {
      return guard;
    }
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

    if (!recipe || !membership) {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Das Rezept ist nicht in der Rezeptdatenbank verfügbar.",
      });
    }

    const role = membership.role;
    const ralfUserId =
      role === "wurstclub" || role === "meisterclub" || role === "admin"
        ? await resolveRalfUserId()
        : null;

    const allowed = await canCourseLockedRecipeBeVisibleForUser({
      recipe,
      membership,
      ralfUserId,
    });

    if (!allowed) {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Das Rezept ist nicht in der Rezeptdatenbank verfügbar.",
      });
    }

    const summary = mapToPublicSummary(recipe);
    const payload =
      parseRecipePayload(recipe.payload) ?? getDefaultRecipePayload();

    return recipeSuccess({
      ...summary,
      payload,
    });
  } catch (error) {
    return handlePrismaError(error);
  }
}

/**
 * Kopiert ein Rezept aus der Rezeptdatenbank in die Rezepte des anfragenden Nutzers.
 */
export async function copyOfficialRecipeToUser(
  recipeId: string,
  userId: string,
  membership?: MembershipAccessContext,
): Promise<RecipeServiceResult<ReturnType<typeof mapRecipeToRecord>>> {
  if (membership) {
    const copyCheck = checkMembershipCapability(
      membership,
      "recipe.database.copy",
    );
    const copyGuard = guardMembershipCheck(copyCheck);

    if (copyGuard) {
      return copyGuard;
    }

    const currentCount = await countUserRecipes(userId);
    const createCheck = canCreateOwnRecipe(membership, currentCount);
    const createGuard = guardMembershipCheck(createCheck);

    if (createGuard) {
      return createGuard;
    }
  }

  if (!isValidUuid(recipeId)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Die Rezept-ID muss eine gültige UUID sein.",
    });
  }

  if (!isValidUuid(userId)) {
    return recipeFailure({
      code: "VALIDATION_ERROR",
      message: "Die userId muss eine gültige UUID sein.",
    });
  }

  if (!membership) {
    return recipeFailure({
      code: "FORBIDDEN",
      message: "Anmeldung erforderlich.",
    });
  }

  try {
    const source = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!source) {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Das Rezept kann nicht kopiert werden.",
      });
    }

    // Nur Rezepte, die in der Rezeptdatenbank sichtbar sind.
    const allowed = await canCourseLockedRecipeBeVisibleForUser({
      recipe: source,
      membership,
      ralfUserId:
        membership.role === "wurstclub" ||
        membership.role === "meisterclub" ||
        membership.role === "admin"
          ? await resolveRalfUserId()
          : null,
    });

    if (!allowed) {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Das Rezept kann nicht kopiert werden.",
      });
    }

    if (
      source.visibility !== RecipeVisibility.database &&
      source.visibility !== RecipeVisibility.public
    ) {
      return recipeFailure({
        code: "NOT_FOUND",
        message: "Das Rezept kann nicht kopiert werden.",
      });
    }

    const sourcePayload =
      parseRecipePayload(source.payload) ?? getDefaultRecipePayload();

    const copy = await prisma.recipe.create({
      data: {
        userId,
        name: `${source.name} (Kopie)`,
        category: source.category,
        description: source.description,
        status: RecipeStatus.draft,
        visibility: RecipeVisibility.private,
        moderationStatus: "none",
        isOfficialDatabase: false,
        totalWeightKg: source.totalWeightKg,
        payload: sourcePayload as Prisma.InputJsonValue,
        version: 1,
        publishedAt: null,
        adminComment: null,
        moderationReviewedAt: null,
        blockedAt: null,
        source: "USER",
      },
    });

    return recipeSuccess(mapRecipeToRecord(copy));
  } catch (error) {
    return handlePrismaError(error);
  }
}
