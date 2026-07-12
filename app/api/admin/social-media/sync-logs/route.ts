import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { listSocialSyncLogs } from "@/lib/social-media/social-media-admin-service";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const url = new URL(request.url);
  const channelId = url.searchParams.get("channelId") ?? undefined;
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  const logs = await listSocialSyncLogs({
    channelId,
    limit: Number.isFinite(limit) ? limit : undefined,
  });

  return jsonFromAuthResult({ success: true, data: logs });
}
