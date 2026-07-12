import { NextResponse } from "next/server";

import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { startAccountDeletionRequest } from "@/lib/privacy/privacy-request-service";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

export async function POST(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const body = await parseJsonBody(request);

  const result = await startAccountDeletionRequest({
    userId,
    password: typeof body?.password === "string" ? body.password : "",
    acknowledged: body?.acknowledged === true,
  });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: true });
}
