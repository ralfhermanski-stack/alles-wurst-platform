import { ImageResponse } from "next/og";

import { getPublicCertificateShare, getPublicRecipeShare, getShareByToken } from "@/lib/sharing/share-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ shareToken: string }> },
): Promise<Response> {
  const { shareToken } = await context.params;
  const share = await getShareByToken(shareToken);

  if (!share || share.status !== "ACTIVE") {
    return new Response("Not found", { status: 404 });
  }

  if (share.contentType === "RECIPE") {
    const data = await getPublicRecipeShare(shareToken);

    if (!data) {
      return new Response("Not found", { status: 404 });
    }

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            background: "linear-gradient(135deg, #1a1410 0%, #2d241c 100%)",
            color: "#f5e6c8",
            padding: 64,
            fontFamily: "sans-serif",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: "#d4a853" }}>ALLES WURST</div>
            <div style={{ fontSize: 22, opacity: 0.8 }}>{data.category ?? "Rezept"}</div>
          </div>
          <div>
            <div style={{ fontSize: 56, fontWeight: 800, lineHeight: 1.1 }}>{data.title}</div>
            <div style={{ fontSize: 28, marginTop: 16, opacity: 0.85 }}>von {data.authorName}</div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 },
    );
  }

  const data = await getPublicCertificateShare(shareToken);

  if (!data) {
    return new Response("Not found", { status: 404 });
  }

  const label = data.contentType === "DIPLOMA" ? "Teilnahmeurkunde" : "Zertifikat";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #1a1410 0%, #3d2f1f 55%, #1a1410 100%)",
          color: "#f5e6c8",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#d4a853" }}>ALLES WURST</div>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              border: "4px solid #d4a853",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            ✓
          </div>
        </div>
        <div>
          <div style={{ fontSize: 24, color: "#d4a853", letterSpacing: 2 }}>{label.toUpperCase()}</div>
          <div style={{ fontSize: 52, fontWeight: 800, marginTop: 12 }}>{data.studentName}</div>
          <div style={{ fontSize: 30, marginTop: 16, opacity: 0.9 }}>{data.courseTitle}</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
