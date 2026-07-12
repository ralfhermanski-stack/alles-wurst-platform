import { NextResponse } from "next/server";

import { getDataExportForDownload } from "@/lib/privacy/data-export-service";
import { verifyDataExportDownloadToken } from "@/lib/privacy/secure-export-download-token";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token fehlt." }, { status: 400 });
  }

  const payload = verifyDataExportDownloadToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: "Download-Link ungültig oder abgelaufen." },
      { status: 400 },
    );
  }

  const file = await getDataExportForDownload({
    userId: payload.userId,
    exportId: payload.exportId,
  });

  if (!file) {
    return NextResponse.json({ error: "Export nicht verfügbar." }, { status: 404 });
  }

  return new NextResponse(Buffer.from(file.buffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${file.fileName}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
