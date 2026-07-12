import { NextResponse } from "next/server";

import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { getEffectivePermissionKeysForUser } from "@/lib/permissions/granular-admin-auth";

export async function GET(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: "Anmeldung erforderlich." } },
      { status: 401 },
    );
  }

  const keys = await getEffectivePermissionKeysForUser(userId);

  return NextResponse.json({
    success: true,
    data: { permissionKeys: keys },
  });
}
