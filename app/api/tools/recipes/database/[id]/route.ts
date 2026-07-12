import {
  buildRecipeMembershipContext,
  resolveRecipeUserId,
} from "@/lib/auth/recipe-request-auth";
import {
  jsonFromServiceResult,
  parseJsonBody,
} from "@/lib/tools/recipe-api-utils";
import {
  copyOfficialRecipeToUser,
  getOfficialRecipeById,
} from "@/lib/tools/recipe-database-service";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/tools/recipes/database/[id] — Öffentliche Rezeptdetailansicht.
 */
export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const membership = await buildRecipeMembershipContext(request, null);
  const result = await getOfficialRecipeById(id, membership);

  return jsonFromServiceResult(result);
}

/**
 * POST /api/tools/recipes/database/[id]/copy — In eigene Rezepte kopieren.
 */
export async function POST(request: Request, context: RouteContext) {
  const body = await parseJsonBody(request);
  const userId = await resolveRecipeUserId(request, body);

  if (!userId) {
    return jsonFromServiceResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Die userId ist erforderlich.",
      },
    });
  }

  const membership = await buildRecipeMembershipContext(request, userId, body);
  const { id } = await context.params;
  const result = await copyOfficialRecipeToUser(id, userId, membership);

  return jsonFromServiceResult(result);
}
