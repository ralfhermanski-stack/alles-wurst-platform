import { NextResponse } from "next/server";

import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import {
  approvePageSeoDraft,
  rejectPageSeoDraft,
} from "@/lib/page-seo/page-seo-service";

type RouteContext = {
  params: Promise<{ routeKey: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return NextResponse.json({ success: false, error: access.error }, { status: 401 });
  }

  const { routeKey } = await context.params;
  const decodedRouteKey = decodeURIComponent(routeKey);
  const body = (await request.json()) as { action?: "approve" | "reject" };

  try {
    if (body.action === "reject") {
      const data = await rejectPageSeoDraft(decodedRouteKey);
      return NextResponse.json({ success: true, data, message: "SEO-Vorschlag verworfen." });
    }

    const data = await approvePageSeoDraft(decodedRouteKey);
    return NextResponse.json({
      success: true,
      data,
      message: "SEO-Vorschlag freigegeben und live geschaltet.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          message: error instanceof Error ? error.message : "Aktion fehlgeschlagen.",
        },
      },
      { status: 400 },
    );
  }
}
