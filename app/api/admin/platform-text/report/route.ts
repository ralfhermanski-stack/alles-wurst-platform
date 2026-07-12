/**
 * @file app/api/admin/platform-text/report/route.ts
 */

import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { scanHardcodedTexts } from "@/lib/platform-text/platform-text-scan";
import path from "node:path";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const report = scanHardcodedTexts(path.join(process.cwd()));

  return Response.json({ success: true, data: report });
}
