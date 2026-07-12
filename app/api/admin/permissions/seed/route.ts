import { NextResponse } from "next/server";

import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { assertPermissionAccessFromRequest } from "@/lib/permissions/permission-auth";
import { isSuperAdmin } from "@/lib/permissions/permission-service";
import { seedPermissionSystem } from "@/lib/permissions/permission-seed";

export async function POST(request: Request): Promise<Response> {
  const access = await assertPermissionAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  if (!(await isSuperAdmin(access.data.userId))) {
    return NextResponse.json(
      {
        success: false,
        error: { message: "Nur Superadministratoren dürfen das System initialisieren." },
      },
      { status: 403 },
    );
  }

  try {
    const result = await seedPermissionSystem();
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Initialisierung fehlgeschlagen.",
        },
      },
      { status: 500 },
    );
  }
}
