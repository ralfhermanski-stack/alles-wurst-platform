import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { endAdminUserMembership } from "@/lib/admin/admin-user-service";
import { jsonFromAuthResult, parseJsonBody } from "@/lib/auth/auth-api-utils";
import { getNullableStringField } from "@/lib/tools/recipe-api-utils";

type RouteContext = {
  params: Promise<{ userId: string; membershipId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const { userId, membershipId } = await context.params;
  const body = await parseJsonBody(request);
  const note = body ? getNullableStringField(body, "note") : null;

  const result = await endAdminUserMembership(
    userId,
    membershipId,
    access.data.userId,
    note,
  );

  return jsonFromAuthResult(result);
}
