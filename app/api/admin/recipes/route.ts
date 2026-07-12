import { RecipeKind, RecipeModerationStatus, RecipeStatus, RecipeVisibility } from "@prisma/client";

import {
  adminGuardResponse,
  jsonFromServiceResult,
} from "@/lib/admin/admin-api-utils";
import { listAdminRecipes } from "@/lib/admin/admin-recipe-service";

/**
 * GET /api/admin/recipes — Alle Rezepte mit Filtern (Admin).
 */
export async function GET(request: Request) {
  const guard = await adminGuardResponse(request);

  if (guard) {
    return guard;
  }

  const params = new URL(request.url).searchParams;

  const statusParam = params.get("status");
  const visibilityParam = params.get("visibility");
  const moderationParam = params.get("moderationStatus");

  const statusValues = Object.values(RecipeStatus);
  const visibilityValues = Object.values(RecipeVisibility);
  const moderationValues = Object.values(RecipeModerationStatus);
  const recipeKindValues = Object.values(RecipeKind);

  const status =
    statusParam && statusValues.includes(statusParam as RecipeStatus)
      ? (statusParam as RecipeStatus)
      : undefined;

  const visibility =
    visibilityParam &&
    visibilityValues.includes(visibilityParam as RecipeVisibility)
      ? (visibilityParam as RecipeVisibility)
      : undefined;

  const moderationStatus =
    moderationParam &&
    moderationValues.includes(moderationParam as RecipeModerationStatus)
      ? (moderationParam as RecipeModerationStatus)
      : undefined;

  const recipeKindParam = params.get("recipeKind");
  const recipeKind =
    recipeKindParam &&
    recipeKindValues.includes(recipeKindParam as RecipeKind)
      ? (recipeKindParam as RecipeKind)
      : undefined;

  const result = await listAdminRecipes({
    status,
    visibility,
    moderationStatus,
    recipeKind,
    userId: params.get("userId") ?? undefined,
    category: params.get("category") ?? undefined,
    search: params.get("search") ?? undefined,
    includeDeleted: params.get("includeDeleted") === "1",
  });

  return jsonFromServiceResult(result);
}
