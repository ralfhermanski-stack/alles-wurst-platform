import { NextResponse } from "next/server";

import { getOrderLegalDocumentForDownload } from "@/lib/account/order-legal-document-service";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{ orderId: string; documentId: string }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId, documentId } = await context.params;

  const file = await getOrderLegalDocumentForDownload({
    userId,
    orderId,
    documentId,
  });

  if (!file) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(Buffer.from(file.buffer), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `attachment; filename="${file.title.replace(/[^a-zA-Z0-9äöüÄÖÜß._-]/g, "_")}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
