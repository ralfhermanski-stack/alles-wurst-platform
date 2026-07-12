import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { testInstagramConnection } from "@/lib/social-media/social-media-instagram-test";

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
  const result = await testInstagramConnection(channelId);

  if (!result.success) {
    return Response.json(
      {
        success: false,
        error: {
          code: result.errorCode ?? "INSTAGRAM_TEST_FAILED",
          message: result.message,
        },
        data: result,
      },
      { status: 400 },
    );
  }

  return Response.json({ success: true, data: result });
}
