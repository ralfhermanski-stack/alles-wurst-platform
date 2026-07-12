import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { assignAdminUserMembership } from "@/lib/admin/admin-user-service";
import { jsonFromAuthResult, parseJsonBody } from "@/lib/auth/auth-api-utils";
import type { MembershipRole } from "@prisma/client";
import { ASSIGNABLE_MEMBERSHIP_ROLES } from "@/lib/admin/admin-user-service";
import {
  getNullableStringField,
  getStringField,
} from "@/lib/tools/recipe-api-utils";

type RouteContext = { params: Promise<{ userId: string }> };

export async function POST(request: Request, context: RouteContext) {
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

  const role = getStringField(body, "role") as MembershipRole | null;

  if (!role || !ASSIGNABLE_MEMBERSHIP_ROLES.includes(role)) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Gültige Mitgliedschaftsrolle erforderlich.",
      },
    });
  }

  const result = await assignAdminUserMembership(
    userId,
    role,
    access.data.userId,
    {
      extendedUntil: getNullableStringField(body, "extendedUntil"),
      note: getNullableStringField(body, "note"),
    },
  );

  return jsonFromAuthResult(result);
}
