import { NextResponse } from "next/server";

import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { hasAdminPermission } from "@/lib/admin/admin-permissions";
import { processPageSeoQueue } from "@/lib/page-seo/page-seo-queue-service";
import { scanPublicPages } from "@/lib/page-seo/page-seo-service";

async function assertSeoAdmin(request: Request) {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return { error: jsonFromAuthResult(access) };
  }

  if (!hasAdminPermission(access.data.systemRole, "settings.write")) {
    return {
      error: jsonFromAuthResult({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Keine Berechtigung für SEO-Einstellungen.",
        },
      }),
    };
  }

  return { error: null };
}

export async function POST(request: Request): Promise<Response> {
  const auth = await assertSeoAdmin(request);

  if (auth.error) {
    return auth.error;
  }

  try {
    const summary = await scanPublicPages();
    const processed = await processPageSeoQueue();

    return NextResponse.json({
      success: true,
      data: { scan: summary, queue: processed },
    });
  } catch (error) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Scan fehlgeschlagen.",
      },
    });
  }
}
