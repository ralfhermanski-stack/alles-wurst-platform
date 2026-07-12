/**
 * @file app/api/tools/marinades/[id]/duplicate/route.ts
 */

import {
  buildRecipeMembershipContext,
  resolveRecipeUserId,
} from "@/lib/auth/recipe-request-auth";
import { duplicateMarinade } from "@/lib/tools/marinade-service";
import {
  jsonFromServiceResult,
  jsonSuccess,
  parseJsonBody,
} from "@/lib/tools/recipe-api-utils";
import { recipeFailure } from "@/lib/tools/recipe-errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
  const body = await parseJsonBody(request);
  const userId = await resolveRecipeUserId(request, body);

  if (!userId) {
    return jsonFromServiceResult(
      recipeFailure({
        code: "VALIDATION_ERROR",
        message: "Feld userId ist erforderlich.",
      }),
    );
  }

  const membership = await buildRecipeMembershipContext(request, userId, body);
  const result = await duplicateMarinade(id, userId, membership);

  if (result.success) {
    return jsonSuccess(result.data, 201);
  }

  return jsonFromServiceResult(result);
}
