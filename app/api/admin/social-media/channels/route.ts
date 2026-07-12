import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  createSocialChannel,
  listAdminSocialChannels,
} from "@/lib/social-media/social-media-admin-service";
import type { SocialMediaIntegrationMode, SocialMediaPlatform } from "@prisma/client";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const channels = await listAdminSocialChannels();

  return jsonFromAuthResult({ success: true, data: channels });
}

export async function POST(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const body = (await request.json()) as Record<string, unknown>;
  const platform = body.platform as SocialMediaPlatform | undefined;
  const name = typeof body.name === "string" ? body.name : "";

  if (!platform || !name.trim()) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Plattform und Name sind erforderlich.",
      },
    });
  }

  const result = await createSocialChannel({
    platform,
    name,
    publicName: typeof body.publicName === "string" ? body.publicName : null,
    handle: typeof body.handle === "string" ? body.handle : null,
    profileUrl: typeof body.profileUrl === "string" ? body.profileUrl : null,
    externalChannelId:
      typeof body.externalChannelId === "string" ? body.externalChannelId : null,
    description: typeof body.description === "string" ? body.description : null,
    integrationMode:
      typeof body.integrationMode === "string"
        ? (body.integrationMode as SocialMediaIntegrationMode)
        : undefined,
    active: typeof body.active === "boolean" ? body.active : undefined,
    showOnHomepage:
      typeof body.showOnHomepage === "boolean" ? body.showOnHomepage : undefined,
    displayOrder:
      typeof body.displayOrder === "number" ? body.displayOrder : undefined,
  });

  return jsonFromAuthResult(result);
}
