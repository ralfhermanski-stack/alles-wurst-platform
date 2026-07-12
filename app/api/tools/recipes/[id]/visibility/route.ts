/**
 * @file app/api/tools/recipes/[id]/visibility/route.ts
 * @purpose API: Rezeptsichtbarkeit ändern (private | public | database).
 * @route PATCH /api/tools/recipes/{id}/visibility
 */

import { RecipeVisibility } from "@prisma/client";

import { resolveRecipeUserId } from "@/lib/auth/recipe-request-auth";
import {
  getStringField,
  jsonFromServiceResult,
  parseJsonBody,
} from "@/lib/tools/recipe-api-utils";
import { recipeFailure } from "@/lib/tools/recipe-errors";
import { updateRecipeVisibility } from "@/lib/tools/recipe-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PATCH — Sichtbarkeit eines Rezepts ändern.
 * Body: { userId, visibility: "private" | "public" | "database" }
 */
export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  const body = await parseJsonBody(request);

  if (!body) {
    return jsonFromServiceResult(
      recipeFailure({
        code: "VALIDATION_ERROR",
        message: "Ungültiger JSON-Body.",
      }),
    );
  }

  const userId = await resolveRecipeUserId(request, body);
  const visibilityRaw = getStringField(body, "visibility");

  if (!userId || !visibilityRaw) {
    return jsonFromServiceResult(
      recipeFailure({
        code: "VALIDATION_ERROR",
        message: "Felder userId und visibility sind erforderlich.",
      }),
    );
  }

  if (
    !Object.values(RecipeVisibility).includes(
      visibilityRaw as RecipeVisibility,
    )
  ) {
    return jsonFromServiceResult(
      recipeFailure({
        code: "VALIDATION_ERROR",
        message: "Ungültige Sichtbarkeit. Erlaubt: private, public, database.",
      }),
    );
  }

  const result = await updateRecipeVisibility(
    id,
    userId,
    visibilityRaw as RecipeVisibility,
  );

  return jsonFromServiceResult(result);
}
