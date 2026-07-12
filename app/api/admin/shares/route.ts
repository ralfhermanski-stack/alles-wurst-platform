import { NextResponse } from "next/server";

import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { adminUpdateShare, listAdminShares } from "@/lib/sharing/share-service";

import type { ShareStatus } from "@prisma/client";

export async function GET(request: Request): Promise<Response> {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return NextResponse.json({ success: false, error: access.error }, { status: 401 });
  }

  const data = await listAdminShares();
  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request): Promise<Response> {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return NextResponse.json({ success: false, error: access.error }, { status: 401 });
  }

  const body = (await request.json()) as {
    shareId?: string;
    status?: ShareStatus;
    adminNote?: string;
  };

  if (!body.shareId || !body.status) {
    return NextResponse.json(
      { success: false, error: { message: "Freigabe-ID und Status erforderlich." } },
      { status: 400 },
    );
  }

  await adminUpdateShare({
    shareId: body.shareId,
    status: body.status,
    adminNote: body.adminNote,
    actorUserId: access.data.userId,
  });

  return NextResponse.json({ success: true, message: "Freigabe aktualisiert." });
}
