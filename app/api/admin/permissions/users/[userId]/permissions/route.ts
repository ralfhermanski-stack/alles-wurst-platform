import { NextResponse } from "next/server";

import type { PermissionEffect } from "@prisma/client";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { prisma } from "@/lib/db/prisma";
import { isKnownPermissionKey } from "@/lib/permissions/permission-catalog";
import { writePermissionAuditLog } from "@/lib/permissions/permission-audit";
import { assertPermissionAccessFromRequest } from "@/lib/permissions/permission-auth";
import { assertCanGrantPermissions } from "@/lib/permissions/superadmin-guard";

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
    permissionKey?: string;
    effect?: PermissionEffect;
    validUntil?: string | null;
  };

  if (!body.permissionKey || !isKnownPermissionKey(body.permissionKey)) {
    return NextResponse.json(
      { success: false, error: { message: "Ungültiger Berechtigungsschlüssel." } },
      { status: 400 },
    );
  }

  if (body.effect !== "ALLOW" && body.effect !== "DENY") {
    return NextResponse.json(
      { success: false, error: { message: "Effect muss ALLOW oder DENY sein." } },
      { status: 400 },
    );
  }

  try {
    if (body.effect === "ALLOW") {
      await assertCanGrantPermissions(access.data.userId, [body.permissionKey]);
    }

    const permission = await prisma.permission.findUnique({
      where: { key: body.permissionKey },
    });

    if (!permission) {
      throw new Error("Berechtigung nicht gefunden.");
    }

    await prisma.userPermission.upsert({
      where: {
        userId_permissionId: { userId, permissionId: permission.id },
      },
      create: {
        userId,
        permissionId: permission.id,
        effect: body.effect,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        assignedByUserId: access.data.userId,
      },
      update: {
        effect: body.effect,
        validUntil: body.validUntil ? new Date(body.validUntil) : null,
        assignedByUserId: access.data.userId,
      },
    });

    await writePermissionAuditLog({
      action:
        body.effect === "ALLOW" ? "user_permission_allowed" : "user_permission_denied",
      actorUserId: access.data.userId,
      targetUserId: userId,
      permissionKey: body.permissionKey,
      summary: `Individuelle Berechtigung ${body.effect === "ALLOW" ? "erlaubt" : "verweigert"}: ${body.permissionKey}`,
    });

    return NextResponse.json({ success: true, data: { saved: true } });
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
  const access = await assertPermissionAccessFromRequest(request, "admin.users.manage");

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const { userId } = await context.params;
  const body = (await request.json()) as { permissionKey?: string };

  if (!body.permissionKey) {
    return NextResponse.json(
      { success: false, error: { message: "Berechtigungsschlüssel fehlt." } },
      { status: 400 },
    );
  }

  const permission = await prisma.permission.findUnique({
    where: { key: body.permissionKey },
  });

  if (permission) {
    await prisma.userPermission.deleteMany({
      where: { userId, permissionId: permission.id },
    });

    await writePermissionAuditLog({
      action: "user_permission_removed",
      actorUserId: access.data.userId,
      targetUserId: userId,
      permissionKey: body.permissionKey,
      summary: `Individuelle Berechtigung entfernt: ${body.permissionKey}`,
    });
  }

  return NextResponse.json({ success: true, data: { removed: true } });
}
