/**
 * @file app/api/tools/marinades/route.ts
 * @routes GET /api/tools/marinades — Liste
 *         POST /api/tools/marinades — Anlegen
 */

import { RecipeStatus, RecipeVisibility } from "@prisma/client";

import {
  buildRecipeMembershipContext,
  resolveRecipeUserId,
} from "@/lib/auth/recipe-request-auth";
import { canUseMarinadeGenerator } from "@/lib/tools/marinade-access";
import {
  createMarinade,
  listMarinades,
} from "@/lib/tools/marinade-service";
import { parseMarinadePayload } from "@/lib/tools/marinade-payload-validator";
import {
  getNullableStringField,
  getStringField,
  jsonFromServiceResult,
  jsonSuccess,
  parseJsonBody,
} from "@/lib/tools/recipe-api-utils";
import { recipeFailure } from "@/lib/tools/recipe-errors";
import { guardMembershipCheck } from "@/lib/membership/membership-guard";

export async function GET(request: Request): Promise<Response> {
  const userId = await resolveRecipeUserId(request);

  if (!userId) {
    return jsonFromServiceResult(
      recipeFailure({
        code: "VALIDATION_ERROR",
        message: "Nutzer-ID ist erforderlich.",
      }),
    );
  }

  const membership = await buildRecipeMembershipContext(request, userId);
  const useGuard = guardMembershipCheck(canUseMarinadeGenerator(membership));

  if (useGuard) {
    return jsonFromServiceResult(useGuard);
  }

  const result = await listMarinades({ userId, membership });

  return jsonFromServiceResult(result);
}

export async function POST(request: Request): Promise<Response> {
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
  const name = getStringField(body, "name");

  if (!userId || !name) {
    return jsonFromServiceResult(
      recipeFailure({
        code: "VALIDATION_ERROR",
        message: "Felder userId und name sind erforderlich.",
      }),
    );
  }

  let payload;

  if (body.payload !== undefined) {
    payload = parseMarinadePayload(body.payload);

    if (!payload) {
      return jsonFromServiceResult(
        recipeFailure({
          code: "VALIDATION_ERROR",
          message: "Ungültiges Marinaden-Payload.",
        }),
      );
    }
  }

  const statusRaw = getStringField(body, "status");
  const visibilityRaw = getStringField(body, "visibility");
  const membership = await buildRecipeMembershipContext(request, userId, body);

  const status =
    statusRaw &&
    Object.values(RecipeStatus).includes(statusRaw as RecipeStatus)
      ? (statusRaw as RecipeStatus)
      : undefined;

  const visibility =
    visibilityRaw &&
    Object.values(RecipeVisibility).includes(visibilityRaw as RecipeVisibility)
      ? (visibilityRaw as RecipeVisibility)
      : undefined;

  const result = await createMarinade({
    userId,
    name,
    category: getNullableStringField(body, "category"),
    description: getNullableStringField(body, "description"),
    payload: payload ?? undefined,
    status,
    visibility,
    membership,
  });

  if (result.success) {
    return jsonSuccess(result.data, 201);
  }

  return jsonFromServiceResult(result);
}
