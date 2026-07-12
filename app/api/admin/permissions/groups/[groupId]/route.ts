import { NextResponse } from "next/server";

import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  deleteUserGroup,
  duplicateUserGroup,
  getUserGroupDetail,
  updateUserGroup,
} from "@/lib/permissions/group-service";
import { assertPermissionAccessFromRequest } from "@/lib/permissions/permission-auth";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertPermissionAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const { groupId } = await context.params;
  const group = await getUserGroupDetail(groupId);

  if (!group) {
    return NextResponse.json(
      { success: false, error: { message: "Gruppe nicht gefunden." } },
      { status: 404 },
    );
  }

  return NextResponse.json({ success: true, data: group });
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertPermissionAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const { groupId } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;

  try {
    const group = await updateUserGroup(access.data.userId, groupId, {
      name: typeof body.name === "string" ? body.name : undefined,
      description:
        typeof body.description === "string" ? body.description : undefined,
      internalNote:
        typeof body.internalNote === "string" ? body.internalNote : undefined,
      color: typeof body.color === "string" ? body.color : undefined,
      priority: typeof body.priority === "number" ? body.priority : undefined,
      status:
        body.status === "active" ||
        body.status === "deactivated" ||
        body.status === "archived"
          ? body.status
          : undefined,
    });

    return NextResponse.json({ success: true, data: group });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Speichern fehlgeschlagen.",
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
  const access = await assertPermissionAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const { groupId } = await context.params;

  try {
    await deleteUserGroup(access.data.userId, groupId);
    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Löschen fehlgeschlagen.",
        },
      },
      { status: 400 },
    );
  }
}
