import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { hasAdminPermission } from "@/lib/admin/admin-permissions";
import {
  getPageSeoSettings,
  updatePageSeoSettings,
} from "@/lib/page-seo/page-seo-service";
import type { UpdatePageSeoSettingsInput } from "@/lib/page-seo/page-seo-types";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

export async function PATCH(request: Request): Promise<Response> {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  if (!hasAdminPermission(access.data.systemRole, "settings.write")) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Keine Berechtigung für SEO-Einstellungen.",
      },
    });
  }

  const body = await parseJsonBody<UpdatePageSeoSettingsInput>(request);

  if (!body) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Ungültiger JSON-Body.",
      },
    });
  }

  try {
    const settings = await updatePageSeoSettings(body);
    return Response.json({ success: true, data: settings });
  } catch (error) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "Speichern fehlgeschlagen.",
      },
    });
  }
}
