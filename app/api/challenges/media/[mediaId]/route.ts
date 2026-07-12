import { readFile } from "node:fs/promises";

import { NextResponse } from "next/server";

import {
  guessChallengeImageMimeType,
  resolveChallengeMediaPath,
} from "@/lib/challenges/challenge-media-storage";
import { prisma } from "@/lib/db/prisma";

type RouteContext = { params: Promise<{ mediaId: string }> };

export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { mediaId } = await context.params;

  const media = await prisma.challengeSubmissionMedia.findUnique({
    where: { id: mediaId },
    include: {
      submission: {
        select: { status: true, publicConsent: true },
      },
    },
  });

  if (!media) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }

  const isPublic = media.submission.status === "APPROVED" && media.submission.publicConsent;

  if (!isPublic) {
    return NextResponse.json({ error: "Nicht verfügbar" }, { status: 403 });
  }

  try {
    const bytes = await readFile(resolveChallengeMediaPath(media.storageKey));

    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": media.mimeType || guessChallengeImageMimeType(media.storageKey),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Datei nicht gefunden" }, { status: 404 });
  }
}
