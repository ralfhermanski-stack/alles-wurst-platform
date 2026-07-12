import { NextResponse } from "next/server";

import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { resolveWithdrawalPrefill } from "@/lib/legal/withdrawal-account-service";

export async function GET(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!userId || !token) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const result = await resolveWithdrawalPrefill({ userId, token });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: result.data });
}
