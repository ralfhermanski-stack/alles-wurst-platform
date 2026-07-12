import { NextResponse } from "next/server";

import { confirmExportEmailToken } from "@/lib/privacy/privacy-request-service";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { success: false, error: { message: "Token fehlt." } },
      { status: 400 },
    );
  }

  const result = await confirmExportEmailToken(token);

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, data: result.data });
}
