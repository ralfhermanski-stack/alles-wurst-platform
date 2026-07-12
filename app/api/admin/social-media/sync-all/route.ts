import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { prisma } from "@/lib/db/prisma";
import { syncSocialMediaChannel } from "@/lib/social-media/social-media-sync-service";

export async function POST(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  try {
    const channels = await prisma.socialMediaChannel.findMany({
      where: {
        active: true,
        integrationMode: "API",
        isTestData: false,
      },
    });

    let synced = 0;

    for (const channel of channels) {
      const result = await syncSocialMediaChannel(channel.id, "manual");
      if (result.success) {
        synced += 1;
      }
    }

    return jsonFromAuthResult({
      success: true,
      data: {
        synced,
        message: "Die manuelle Synchronisierung wurde erfolgreich abgeschlossen.",
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
