import { NextResponse } from "next/server";

import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { getPrivacyCenterOverview } from "@/lib/privacy/privacy-request-service";

export async function GET(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return NextResponse.json({ success: false, error: { message: "Unauthorized" } }, { status: 401 });
  }

  const overview = await getPrivacyCenterOverview(userId);

  return NextResponse.json({
    success: true,
    data: {
      requests: overview.requests.map((request) => ({
        id: request.id,
        requestNumber: request.requestNumber,
        type: request.type,
        status: request.status,
      })),
      exports: overview.exports.map((entry) => ({
        id: entry.id,
        status: entry.status,
        expiresAt: entry.expiresAt?.toISOString() ?? null,
        generatedAt: entry.generatedAt?.toISOString() ?? null,
        downloadable:
          (entry.status === "READY" || entry.status === "DOWNLOADED") &&
          !!entry.expiresAt &&
          entry.expiresAt > new Date() &&
          !!entry.storageKey,
      })),
    },
  });
}
