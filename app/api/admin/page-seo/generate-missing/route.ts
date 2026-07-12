import { NextResponse } from "next/server";

import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { hasAdminPermission } from "@/lib/admin/admin-permissions";
import { processPageSeoQueue } from "@/lib/page-seo/page-seo-queue-service";
import { queueMissingPageSeo } from "@/lib/page-seo/page-seo-service";

export async function POST(request: Request): Promise<Response> {
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
    const queued = await queueMissingPageSeo();
    const queue = await processPageSeoQueue();

    return NextResponse.json({
      success: true,
      data: { queued, queue },
    });
  } catch (error) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Generierung fehlgeschlagen.",
      },
    });
  }
}
