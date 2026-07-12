import { NextResponse } from "next/server";

import { authorizeLegalCron } from "@/lib/legal/legal-cron-auth";
import { runPrivacyMaintenanceJobs } from "@/lib/privacy/privacy-cron-service";

export async function POST(request: Request): Promise<Response> {
  const auth = authorizeLegalCron(request);

  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: auth.status },
    );
  }

  try {
    const result = await runPrivacyMaintenanceJobs();
    return NextResponse.json({ success: true, ...result });
  } catch {
    return NextResponse.json(
      { success: false, error: "Datenschutz-Wartungsjobs fehlgeschlagen." },
      { status: 500 },
    );
  }
}
