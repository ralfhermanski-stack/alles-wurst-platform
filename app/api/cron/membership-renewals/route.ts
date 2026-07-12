import { NextResponse } from "next/server";

import { authorizeMembershipCron } from "@/lib/membership/membership-cron-auth";
import { runMembershipMaintenanceJobs } from "@/lib/membership/membership-renewal-cron-service";

export async function POST(request: Request): Promise<Response> {
  const auth = authorizeMembershipCron(request);

  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: auth.status },
    );
  }

  try {
    const result = await runMembershipMaintenanceJobs();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[cron/membership-renewals] failed:", error);
    return NextResponse.json(
      { success: false, error: "Mitgliedschafts-Wartungsjobs fehlgeschlagen." },
      { status: 500 },
    );
  }
}
