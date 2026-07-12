import { NextResponse } from "next/server";

import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { assertPermissionAccessFromRequest } from "@/lib/permissions/permission-auth";
import { checkPermission } from "@/lib/permissions/permission-service";

type RouteContext = { params: Promise<{ userId: string }> };

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertPermissionAccessFromRequest(request, "admin.users.view");

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const { userId } = await context.params;
  const body = (await request.json()) as { permissionKey?: string };

  if (!body.permissionKey) {
    return NextResponse.json(
      { success: false, error: { message: "Berechtigungsschlüssel fehlt." } },
      { status: 400 },
    );
  }

  const result = await checkPermission(userId, body.permissionKey);
  return NextResponse.json({ success: true, data: result });
}
