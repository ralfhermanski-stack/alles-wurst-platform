import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { prisma } from "@/lib/db/prisma";
import { saveSocialCredential } from "@/lib/social-media/social-media-sync-service";

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
  const body = (await request.json()) as Record<string, unknown>;
  const credentialType =
    typeof body.credentialType === "string" ? body.credentialType.trim() : "";
  const value = typeof body.value === "string" ? body.value : "";

  if (!credentialType || !value.trim()) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Typ und Wert der Zugangsdaten sind erforderlich.",
      },
    });
  }

  const channel = await prisma.socialMediaChannel.findUnique({
    where: { id: channelId },
    select: { id: true },
  });

  if (!channel) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Kanal nicht gefunden.",
      },
    });
  }

  const expiresAt =
    typeof body.expiresAt === "string" && body.expiresAt.trim()
      ? new Date(body.expiresAt)
      : null;

  await saveSocialCredential(channelId, credentialType, value.trim(), expiresAt);

  return jsonFromAuthResult({
    success: true,
    data: { credentialType, saved: true },
  });
}
