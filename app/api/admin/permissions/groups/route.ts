import { NextResponse } from "next/server";

import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  createUserGroup,
  getCatalogForMatrix,
  listUserGroups,
} from "@/lib/permissions/group-service";
import { assertPermissionAccessFromRequest } from "@/lib/permissions/permission-auth";

export async function GET(request: Request): Promise<Response> {
  const access = await assertPermissionAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const groups = await listUserGroups();

  return NextResponse.json({ success: true, data: groups });
}

export async function POST(request: Request): Promise<Response> {
  const access = await assertPermissionAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const body = (await request.json()) as {
    name?: string;
    description?: string;
    internalNote?: string;
    color?: string;
    priority?: number;
  };

  if (!body.name?.trim()) {
    return NextResponse.json(
      { success: false, error: { message: "Name ist erforderlich." } },
      { status: 400 },
    );
  }

  try {
    const group = await createUserGroup(access.data.userId, {
      name: body.name,
      description: body.description,
      internalNote: body.internalNote,
      color: body.color,
      priority: body.priority,
    });

    return NextResponse.json({ success: true, data: group });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Gruppe konnte nicht erstellt werden.",
        },
      },
      { status: 400 },
    );
  }
}
