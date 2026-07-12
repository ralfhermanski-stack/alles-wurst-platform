import { NextResponse } from "next/server";

import { processPageSeoQueue } from "@/lib/page-seo/page-seo-queue-service";
import { scanPublicPages } from "@/lib/page-seo/page-seo-service";

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.PAGE_SEO_CRON_SECRET?.trim();

  if (!secret) {
    return false;
  }

  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function POST(request: Request): Promise<Response> {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const scan = await scanPublicPages();
    const queue = await processPageSeoQueue(10);

    return NextResponse.json({ success: true, scan, queue });
  } catch (error) {
    console.error("[cron/page-seo] failed:", error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Cron fehlgeschlagen.",
      },
      { status: 500 },
    );
  }
}
