/**
 * @file app/api/tools/recipes/[id]/status/route.ts
 * @purpose API: Rezeptstatus ändern (draft | saved | published).
 * @route PATCH /api/tools/recipes/{id}/status
 */

import { RecipeStatus } from "@prisma/client";

import { resolveRecipeUserId } from "@/lib/auth/recipe-request-auth";
import {
  getStringField,
  jsonFromServiceResult,
  parseJsonBody,
} from "@/lib/tools/recipe-api-utils";
import { recipeFailure } from "@/lib/tools/recipe-errors";
import { updateRecipeStatus } from "@/lib/tools/recipe-service";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * PATCH — Status eines Rezepts ändern.
 * Body: { userId, status: "draft" | "saved" | "published" }
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
  const statusRaw = getStringField(body, "status");

  if (!userId || !statusRaw) {
    return jsonFromServiceResult(
      recipeFailure({
        code: "VALIDATION_ERROR",
        message: "Felder userId und status sind erforderlich.",
      }),
    );
  }

  if (!Object.values(RecipeStatus).includes(statusRaw as RecipeStatus)) {
    return jsonFromServiceResult(
      recipeFailure({
        code: "VALIDATION_ERROR",
        message: "Ungültiger Status. Erlaubt: draft, saved, published.",
      }),
    );
  }

  const result = await updateRecipeStatus(
    id,
    userId,
    statusRaw as RecipeStatus,
  );

  return jsonFromServiceResult(result);
}
