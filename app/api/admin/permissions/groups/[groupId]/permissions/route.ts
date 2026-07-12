import { NextResponse } from "next/server";

import type { PermissionEffect } from "@prisma/client";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { setGroupPermissions } from "@/lib/permissions/group-service";
import { assertPermissionAccessFromRequest } from "@/lib/permissions/permission-auth";

type RouteContext = { params: Promise<{ groupId: string }> };

export async function PUT(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertPermissionAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const { groupId } = await context.params;
  const body = (await request.json()) as {
    entries?: Array<{ permissionKey: string; effect: PermissionEffect | null }>;
  };

  if (!body.entries) {
    return NextResponse.json(
      { success: false, error: { message: "Keine Berechtigungen übermittelt." } },
      { status: 400 },
    );
  }

  try {
    const group = await setGroupPermissions(
      access.data.userId,
      groupId,
      body.entries,
    );

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
