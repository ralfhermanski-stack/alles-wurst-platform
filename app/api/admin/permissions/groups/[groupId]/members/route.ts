import { NextResponse } from "next/server";

import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { addUsersToGroup } from "@/lib/permissions/group-service";
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
  const body = (await request.json()) as {
    userIds?: string[];
    validFrom?: string | null;
    validUntil?: string | null;
  };

  if (!body.userIds?.length) {
    return NextResponse.json(
      { success: false, error: { message: "Keine Benutzer ausgewählt." } },
      { status: 400 },
    );
  }

  try {
    const added = await addUsersToGroup(access.data.userId, groupId, body.userIds, {
      validFrom: body.validFrom ? new Date(body.validFrom) : null,
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
