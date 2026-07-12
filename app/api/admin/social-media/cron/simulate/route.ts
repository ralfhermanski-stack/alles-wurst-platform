import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { syncAllDueSocialChannels } from "@/lib/social-media/social-media-sync-service";

export async function POST(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  try {
    const synced = await syncAllDueSocialChannels("cron");

    return jsonFromAuthResult({
      success: true,
      data: {
        synced,
        message: "Die Synchronisierung wurde erfolgreich abgeschlossen.",
      },
    });
  } catch {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Die Synchronisierung konnte nicht durchgeführt werden.",
      },
    });
  }
}
