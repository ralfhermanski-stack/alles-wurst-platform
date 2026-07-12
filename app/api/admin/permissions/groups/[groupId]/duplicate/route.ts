import { NextResponse } from "next/server";

import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { duplicateUserGroup } from "@/lib/permissions/group-service";
import { assertPermissionAccessFromRequest } from "@/lib/permissions/permission-auth";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertPermissionAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const { groupId } = await context.params;

  try {
    const group = await duplicateUserGroup(access.data.userId, groupId);
    return NextResponse.json({ success: true, data: group });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Duplizieren fehlgeschlagen.",
        },
      },
      { status: 400 },
    );
  }
}
