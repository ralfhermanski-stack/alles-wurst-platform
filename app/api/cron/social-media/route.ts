import { NextResponse } from "next/server";

import { authorizeSocialMediaCron } from "@/lib/social-media/social-media-cron-auth";
import { syncAllDueSocialChannels } from "@/lib/social-media/social-media-sync-service";

export async function POST(request: Request): Promise<Response> {
  const auth = authorizeSocialMediaCron(request);

  if (!auth.authorized) {
    return NextResponse.json(
      { success: false, error: auth.reason ?? "Unauthorized" },
      { status: auth.status },
    );
  }

  try {
    const synced = await syncAllDueSocialChannels("cron");

    return NextResponse.json({
      success: true,
      synced,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "Die Synchronisierung konnte nicht durchgeführt werden.",
      },
      { status: 500 },
    );
  }
}
