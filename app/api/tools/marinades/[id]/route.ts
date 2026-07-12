/**
 * @file app/api/tools/marinades/[id]/route.ts
 */

import { RecipeStatus, RecipeVisibility } from "@prisma/client";

import {
  buildRecipeMembershipContext,
  resolveRecipeUserId,
} from "@/lib/auth/recipe-request-auth";
import { canUseMarinadeGenerator } from "@/lib/tools/marinade-access";
import {
  deleteMarinade,
  getMarinadeById,
  updateMarinade,
} from "@/lib/tools/marinade-service";
import { parseMarinadePayload } from "@/lib/tools/marinade-payload-validator";
import {
  getNullableStringField,
  getStringField,
  jsonFromServiceResult,
  parseJsonBody,
} from "@/lib/tools/recipe-api-utils";
import { recipeFailure } from "@/lib/tools/recipe-errors";
import { guardMembershipCheck } from "@/lib/membership/membership-guard";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { id } = await context.params;
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

  const result = await getMarinadeById(id, userId, membership);

  return jsonFromServiceResult(result);
}

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

  if (!userId) {
    return jsonFromServiceResult(
      recipeFailure({
        code: "VALIDATION_ERROR",
        message: "Feld userId ist erforderlich.",
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

  const membership = await buildRecipeMembershipContext(request, userId, body);
  const statusRaw = getStringField(body, "status");
  const visibilityRaw = getStringField(body, "visibility");

  const result = await updateMarinade(id, {
    userId,
    name: getStringField(body, "name"),
    category: getNullableStringField(body, "category"),
    description: getNullableStringField(body, "description"),
    payload: payload ?? undefined,
    status:
      statusRaw &&
      Object.values(RecipeStatus).includes(statusRaw as RecipeStatus)
        ? (statusRaw as RecipeStatus)
        : undefined,
    visibility:
      visibilityRaw &&
      Object.values(RecipeVisibility).includes(
        visibilityRaw as RecipeVisibility,
      )
        ? (visibilityRaw as RecipeVisibility)
        : undefined,
    membership,
  });

  return jsonFromServiceResult(result);
}

export async function DELETE(
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
        message: "userId ist erforderlich.",
      }),
    );
  }

  const result = await deleteMarinade(id, userId);

  return jsonFromServiceResult(result);
}
