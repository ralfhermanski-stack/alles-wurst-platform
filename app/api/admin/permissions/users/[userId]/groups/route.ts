import { NextResponse } from "next/server";

import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { addUsersToGroup, removeUserFromGroup } from "@/lib/permissions/group-service";
import { assertPermissionAccessFromRequest } from "@/lib/permissions/permission-auth";

type RouteContext = { params: Promise<{ userId: string }> };

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertPermissionAccessFromRequest(request, "admin.users.manage");

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const { userId } = await context.params;
  const body = (await request.json()) as {
    groupId?: string;
    validUntil?: string | null;
  };

  if (!body.groupId) {
    return NextResponse.json(
      { success: false, error: { message: "Gruppe fehlt." } },
      { status: 400 },
    );
  }

  try {
    const added = await addUsersToGroup(access.data.userId, body.groupId, [userId], {
      validUntil: body.validUntil ? new Date(body.validUntil) : null,
      isManual: true,
    });

    return NextResponse.json({ success: true, data: { added } });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Zuordnung fehlgeschlagen.",
        },
      },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertPermissionAccessFromRequest(request, "admin.users.manage");

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const { userId } = await context.params;
  const body = (await request.json()) as { groupId?: string };

  if (!body.groupId) {
    return NextResponse.json(
      { success: false, error: { message: "Gruppe fehlt." } },
      { status: 400 },
    );
  }

  try {
    await removeUserFromGroup(access.data.userId, body.groupId, userId);
    return NextResponse.json({ success: true, data: { removed: true } });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Entfernen fehlgeschlagen.",
        },
      },
      { status: 400 },
    );
  }
}
