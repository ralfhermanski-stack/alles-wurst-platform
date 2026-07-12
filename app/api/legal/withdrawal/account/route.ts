import { NextResponse } from "next/server";

import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { submitAccountWithdrawal } from "@/lib/legal/withdrawal-account-service";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

export async function POST(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return NextResponse.json(
      { success: false, error: { message: "Unauthorized" } },
      { status: 401 },
    );
  }

  const body = await parseJsonBody(request);

  const result = await submitAccountWithdrawal({
    userId,
    token: typeof body?.token === "string" ? body.token : "",
    declarationText:
      typeof body?.declarationText === "string" ? body.declarationText : "",
    message: typeof body?.message === "string" ? body.message : null,
    confirmed: body?.confirmed === true,
  });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: result.data });
}
