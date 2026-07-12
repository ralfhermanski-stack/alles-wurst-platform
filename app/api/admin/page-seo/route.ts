import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { hasAdminPermission } from "@/lib/admin/admin-permissions";
import { prisma } from "@/lib/db/prisma";
import {
  getPageSeoSettings,
  listPageSeoAdminItems,
} from "@/lib/page-seo/page-seo-service";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

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

  try {
    const [settings, pages, queuePending] = await Promise.all([
      getPageSeoSettings(),
      listPageSeoAdminItems(),
      prisma.pageSeoQueueJob.count({ where: { status: "pending" } }),
    ]);

    return Response.json({
      success: true,
      data: { settings, pages, queuePending },
    });
  } catch (error) {
    console.error("[admin/page-seo] GET failed:", error);

    return jsonFromAuthResult({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "SEO-Übersicht konnte nicht geladen werden.",
      },
    });
  }
}
