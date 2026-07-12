import {
  adminGuardResponse,
  getNullableStringField,
  getStringField,
  jsonFromServiceResult,
  parseJsonBody,
} from "@/lib/admin/admin-api-utils";
import type { ModerationAction } from "@/lib/admin/admin-labels";
import { moderateAdminRecipe } from "@/lib/admin/admin-recipe-service";

type RouteContext = { params: Promise<{ id: string }> };

const ALLOWED_ACTIONS: ModerationAction[] = [
  "approve",
  "reject",
  "block",
  "adopt",
  "reset",
];

/**
 * PATCH /api/admin/recipes/[id]/moderation — Freigabe, Ablehnung, Sperre, Übernahme.
 */
export async function PATCH(request: Request, context: RouteContext) {
  const guard = await adminGuardResponse(request);

  if (guard) {
    return guard;
  }

  const body = await parseJsonBody(request);

  if (!body) {
    return jsonFromServiceResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Ungültiger JSON-Body.",
      },
    });
  }

  const action = getStringField(body, "action") as ModerationAction | undefined;

  if (!action || !ALLOWED_ACTIONS.includes(action)) {
    return jsonFromServiceResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Ungültige Moderationsaktion.",
      },
    });
  }

  const { id } = await context.params;

  const result = await moderateAdminRecipe(
    id,
    action,
    getNullableStringField(body, "adminComment"),
  );

  return jsonFromServiceResult(result);
}
