import { NextResponse } from "next/server";

import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getEffectivePermissionKeysForUser } from "@/lib/permissions/granular-admin-auth";
import { isSuperAdmin } from "@/lib/permissions/permission-service";
import { isAdminSystemRole } from "@/lib/users/system-role";

export async function GET(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Anmeldung erforderlich." },
    });
  }

  const [keys, superAdmin, user] = await Promise.all([
    getEffectivePermissionKeysForUser(userId),
    isSuperAdmin(userId),
    prisma.user.findUnique({
      where: { id: userId },
      select: { systemRole: true },
    }),
  ]);

  const isAdmin = isAdminSystemRole(user?.systemRole);

  return NextResponse.json({
    success: true,
    data: {
      permissionKeys: keys,
      isSuperAdmin: superAdmin,
      isAdmin,
    },
  });
}
