/**
 * @file page-editor-session.ts
 * @purpose Session-Validierung ohne Node-Crypto (für Route Handler / Edge-tauglich).
 */

import { prisma } from "@/lib/db/prisma";

export async function validatePageEditorSession(input: {
  sessionId: string;
  userId: string;
  pageId: string;
}): Promise<boolean> {
  const session = await prisma.pageEditorSession.findUnique({
    where: { id: input.sessionId },
  });

  if (!session) {
    return false;
  }

  if (session.userId !== input.userId || session.pageId !== input.pageId) {
    return false;
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    return false;
  }

  return true;
}
