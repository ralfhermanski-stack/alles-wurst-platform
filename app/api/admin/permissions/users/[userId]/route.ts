import { NextResponse } from "next/server";

import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { assertPermissionAccessFromRequest } from "@/lib/permissions/permission-auth";
import { checkPermission, getUserRightsOverview } from "@/lib/permissions/permission-service";

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertPermissionAccessFromRequest(request, "admin.users.view");

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const { userId } = await context.params;
  const overview = await getUserRightsOverview(userId);

  if (!overview) {
    return NextResponse.json(
      { success: false, error: { message: "Benutzer nicht gefunden." } },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, data: overview });
}
