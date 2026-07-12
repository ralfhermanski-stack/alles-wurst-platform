import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { prisma } from "@/lib/db/prisma";

type RouteContext = {
  params: Promise<{ channelId: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { channelId } = await context.params;

  const channel = await prisma.socialMediaChannel.findUnique({
    where: { id: channelId },
  });

  if (!channel || channel.platform !== "INSTAGRAM") {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Instagram-Kanal nicht gefunden.",
      },
    });
  }

  await prisma.$transaction([
    prisma.socialMediaCredential.deleteMany({ where: { channelId } }),
    prisma.socialMediaChannel.update({
      where: { id: channelId },
      data: {
        connectionStatus: "NOT_CONFIGURED",
        lastErrorAt: null,
        lastErrorMessage: null,
        lastSyncedAt: null,
      },
    }),
  ]);

  return jsonFromAuthResult({
    success: true,
    data: { reset: true },
  });
}
