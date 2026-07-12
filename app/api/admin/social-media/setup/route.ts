import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  checkSetupSection,
  getSocialMediaSetupOverview,
  type SetupSectionId,
} from "@/lib/social-media/social-media-setup-service";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const overview = await getSocialMediaSetupOverview();

  return jsonFromAuthResult({ success: true, data: overview });
}

export async function POST(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const body = (await request.json()) as Record<string, unknown>;
  const sectionId = body.sectionId as SetupSectionId | undefined;
  const youtubeChannelId =
    typeof body.youtubeChannelId === "string" ? body.youtubeChannelId : undefined;

  if (!sectionId) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Prüfbereich fehlt.",
      },
    });
  }

  const result = await checkSetupSection(sectionId, { youtubeChannelId });

  return jsonFromAuthResult({ success: true, data: result });
}
