import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import {
  getAdminUserDetail,
  updateAdminUserAccountStatus,
  updateAdminUserMaintenanceBypass,
  updateAdminUserSystemRole,
} from "@/lib/admin/admin-user-service";
import { jsonFromAuthResult, parseJsonBody } from "@/lib/auth/auth-api-utils";
import type { UserAccountStatus, UserSystemRole } from "@prisma/client";
import { USER_SYSTEM_ROLE_OPTIONS } from "@/lib/users/system-role";

type RouteContext = { params: Promise<{ userId: string }> };

export async function GET(request: Request, context: RouteContext) {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { userId } = await context.params;
  const result = await getAdminUserDetail(userId);

  return jsonFromAuthResult(result);
}

export async function PATCH(request: Request, context: RouteContext) {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const { userId } = await context.params;
  const body = await parseJsonBody(request);

  if (!body) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Ungültiger Request-Body.",
      },
    });
  }

  const note =
    typeof body.note === "string" ? body.note.trim() || null : null;

  if (typeof body.accountStatus === "string") {
    const accountStatus = body.accountStatus as UserAccountStatus;

    if (!["active", "suspended", "deactivated"].includes(accountStatus)) {
      return jsonFromAuthResult({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Ungültiger Kontostatus.",
        },
      });
    }

    const result = await updateAdminUserAccountStatus(
      userId,
      accountStatus,
      access.data.userId,
      note,
    );

    return jsonFromAuthResult(result);
  }

  if (typeof body.systemRole === "string") {
    const systemRole = body.systemRole as UserSystemRole;

    if (!USER_SYSTEM_ROLE_OPTIONS.includes(systemRole)) {
      return jsonFromAuthResult({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Ungültige Systemrolle.",
        },
      });
    }

    const result = await updateAdminUserSystemRole(
      userId,
      systemRole,
      access.data.userId,
      note,
    );

    return jsonFromAuthResult(result);
  }

  if (typeof body.maintenanceBypass === "boolean") {
    const result = await updateAdminUserMaintenanceBypass(
      userId,
      body.maintenanceBypass,
      access.data.userId,
      note,
    );

    return jsonFromAuthResult(result);
  }

  return jsonFromAuthResult({
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "accountStatus, systemRole oder maintenanceBypass ist erforderlich.",
    },
  });
}
