import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { hasAdminPermission } from "@/lib/admin/admin-permissions";
import {
  getMaintenanceSettings,
  listMaintenanceNewsletterSignups,
  updateMaintenanceSettings,
} from "@/lib/maintenance/maintenance-service";
import type { UpdateMaintenanceSettingsInput } from "@/lib/maintenance/maintenance-types";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  try {
    const [settings, signups] = await Promise.all([
      getMaintenanceSettings(),
      listMaintenanceNewsletterSignups(50),
    ]);

    return Response.json({
      success: true,
      data: { settings, signups },
    });
  } catch (error) {
    console.error("[admin/maintenance] GET failed:", error);

    return jsonFromAuthResult({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Wartungseinstellungen konnten nicht geladen werden.",
      },
    });
  }
}

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
        message: "Keine Berechtigung für Systemeinstellungen.",
      },
    });
  }

  const body = await parseJsonBody<UpdateMaintenanceSettingsInput>(request);

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
    const settings = await updateMaintenanceSettings(body);

    return Response.json({ success: true, data: settings });
  } catch (error) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Einstellungen konnten nicht gespeichert werden.",
      },
    });
  }
}
