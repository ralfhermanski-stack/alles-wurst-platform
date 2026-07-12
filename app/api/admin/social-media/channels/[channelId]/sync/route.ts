import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { syncSocialMediaChannel } from "@/lib/social-media/social-media-sync-service";

type RouteContext = {
  params: Promise<{ channelId: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const { channelId } = await context.params;
  const result = await syncSocialMediaChannel(
    channelId,
    "manual",
    access.data.userId,
  );

  return jsonFromAuthResult({ success: true, data: result });
}
