/**
 * @file share-security.ts
 */

import { prisma } from "@/lib/db/prisma";

import type { Prisma, Recipe } from "@prisma/client";

export async function logShareSecurityEvent(input: {
  userId?: string | null;
  recipeId?: string | null;
  shareId?: string | null;
  ipAddress?: string | null;
  action: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  await prisma.shareSecurityLog.create({
    data: {
      userId: input.userId ?? null,
      recipeId: input.recipeId ?? null,
      shareId: input.shareId ?? null,
      ipAddress: input.ipAddress ?? null,
      action: input.action,
      details: (input.details ?? undefined) as Prisma.InputJsonValue | undefined,
    },
  });
}

export function isRecipeShareable(recipe: Pick<Recipe, "userId" | "source" | "isOfficialDatabase" | "deletedAt">): boolean {
  if (recipe.deletedAt) {
    return false;
  }

  if (recipe.source !== "USER") {
    return false;
  }

  if (recipe.isOfficialDatabase) {
    return false;
  }

  return true;
}

export function assertRecipeOwner(
  recipe: Pick<Recipe, "userId">,
  currentUserId: string,
): boolean {
  return recipe.userId === currentUserId;
}

export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");

  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? null;
  }

  return request.headers.get("x-real-ip");
}
