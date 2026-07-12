import { NextResponse } from "next/server";

import { getCatalogForMatrix } from "@/lib/permissions/group-service";
import { assertPermissionAccessFromRequest } from "@/lib/permissions/permission-auth";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";

export async function GET(request: Request): Promise<Response> {
  const access = await assertPermissionAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const catalog = getCatalogForMatrix().map((entry) => ({
    key: entry.key,
    name: entry.name,
    description: entry.description,
    category: entry.category,
    areaKey: entry.areaKey ?? null,
    actionKey: entry.actionKey ?? null,
    isCritical: entry.isCritical ?? false,
    superAdminOnly: entry.superAdminOnly ?? false,
  }));

  return NextResponse.json({ success: true, data: catalog });
}
