import { NextResponse } from "next/server";

import { activateDueDelayedAccess } from "@/lib/legal/legal-checkout-service";
import { authorizeLegalCron } from "@/lib/legal/legal-cron-auth";
import { syncAllLegalDocuments } from "@/lib/legal/legal-document-sync-service";

export async function POST(request: Request): Promise<Response> {
  const auth = authorizeLegalCron(request);

  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: auth.status },
    );
  }

  try {
    const syncResult = await syncAllLegalDocuments("cron");
    const activatedAccess = await activateDueDelayedAccess();

    return NextResponse.json({
      success: true,
      synced: syncResult,
      activatedAccess,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Die Rechtstexte-Synchronisierung konnte nicht durchgeführt werden.",
      },
      { status: 500 },
    );
  }
}
