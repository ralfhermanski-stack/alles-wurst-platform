import { NextResponse } from "next/server";

import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { createWithdrawalRequest } from "@/lib/legal/legal-withdrawal-service";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

export async function POST(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);
  const body = await parseJsonBody(request);

  if (!body) {
    return NextResponse.json(
      { success: false, error: { message: "Ungültige Anfrage." } },
      { status: 400 },
    );
  }

  const result = await createWithdrawalRequest({
    userId,
    firstName: String(body.firstName ?? ""),
    lastName: String(body.lastName ?? ""),
    email: String(body.email ?? ""),
    orderReference:
      typeof body.orderReference === "string" ? body.orderReference : null,
    productName: typeof body.productName === "string" ? body.productName : null,
    orderDate: typeof body.orderDate === "string" ? body.orderDate : null,
    contractDate:
      typeof body.contractDate === "string" ? body.contractDate : null,
    message: typeof body.message === "string" ? body.message : null,
  });

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: result.data });
}
