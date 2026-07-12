import { readFile } from "node:fs/promises";

import { prisma } from "@/lib/db/prisma";
import {
  guessAvatarMimeType,
  resolveUserAvatarPath,
} from "@/lib/users/user-avatar-storage";

type RouteContext = { params: Promise<{ userId: string }> };

/**
 * GET /api/users/[userId]/avatar — Öffentliches Profilbild.
 */
export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { userId } = await context.params;

  const profile = await prisma.userProfile.findUnique({
    where: { userId },
    select: { avatarStorageKey: true },
  });

  if (!profile?.avatarStorageKey) {
    return new Response("Kein Avatar.", { status: 404 });
  }

  try {
    const bytes = await readFile(resolveUserAvatarPath(profile.avatarStorageKey));

    return new Response(bytes, {
      headers: {
        "Content-Type": guessAvatarMimeType(profile.avatarStorageKey),
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return new Response("Avatar nicht gefunden.", { status: 404 });
  }
}
