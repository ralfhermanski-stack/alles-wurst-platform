import {
  adminGuardResponse,
  jsonFromServiceResult,
  parseJsonBody,
} from "@/lib/admin/admin-api-utils";
import {
  getRecipeGeneratorSettings,
  updateRecipeGeneratorSettings,
} from "@/lib/admin/admin-settings-service";
import { getStringField } from "@/lib/tools/recipe-api-utils";

/**
 * GET /api/admin/settings/recipe-generator
 */
export async function GET(request: Request) {
  const guard = await adminGuardResponse(request);

  if (guard) {
    return guard;
  }

  const result = await getRecipeGeneratorSettings();

  return jsonFromServiceResult(result);
}

/**
 * PATCH /api/admin/settings/recipe-generator
 */
export async function PATCH(request: Request) {
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

  const result = await updateRecipeGeneratorSettings({
    pdfHeaderText: getStringField(body, "pdfHeaderText"),
    pdfFooterText: getStringField(body, "pdfFooterText"),
    pdfLogoPlaceholder: getStringField(body, "pdfLogoPlaceholder"),
    pdfLegalNotice:
      typeof body.pdfLegalNotice === "string"
        ? body.pdfLegalNotice
        : undefined,
  });

  return jsonFromServiceResult(result);
}
