/**
 * @file app/api/admin/platform-text/route.ts
 */

import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromPlatformTextResult } from "@/lib/platform-text/platform-text-api-utils";
import { listPlatformTexts } from "@/lib/platform-text/platform-text-service";

export const runtime = "nodejs";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const params = new URL(request.url).searchParams;

  const result = await listPlatformTexts({
    category: params.get("category") ?? undefined,
    search: params.get("search") ?? undefined,
    locale: params.get("locale") ?? undefined,
  });

  return jsonFromPlatformTextResult(result);
}
