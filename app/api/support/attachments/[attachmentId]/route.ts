import { readFile } from "node:fs/promises";

import { assertStaffAccessFromRequest } from "@/lib/admin/staff-auth";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { getTicketForAttachmentAccess } from "@/lib/support/support-ticket-service";
import {
  canReadTicketAsStaff,
  canReadTicketAsUser,
} from "@/lib/support/support-permissions";
import { resolveSupportAttachmentPath } from "@/lib/support/support-attachment-storage";
import { findUserById } from "@/lib/users/user-service";

type RouteContext = { params: Promise<{ attachmentId: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const { attachmentId } = await context.params;
  const access = await getTicketForAttachmentAccess(attachmentId);

  if (!access) {
    return new Response("Nicht gefunden.", { status: 404 });
  }

  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return new Response("Anmeldung erforderlich.", { status: 401 });
  }

  const userResult = await findUserById(userId);

  if (!userResult.success || !userResult.data) {
    return new Response("Zugriff verweigert.", { status: 403 });
  }

  const staffAccess = await assertStaffAccessFromRequest(request);
  const isStaff =
    staffAccess.success &&
    canReadTicketAsStaff(
      userResult.data.systemRole,
      userId,
      access.ticket,
    );
  const isOwner = canReadTicketAsUser(userId, access.ticket);

  if (!isStaff && !isOwner) {
    return new Response("Zugriff verweigert.", { status: 403 });
  }

  try {
    const absolutePath = resolveSupportAttachmentPath(access.attachment.storageKey);
    const bytes = await readFile(absolutePath);

    return new Response(bytes, {
      headers: {
        "Content-Type": access.attachment.mimeType,
        "Content-Disposition": `inline; filename="${access.attachment.fileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new Response("Datei nicht gefunden.", { status: 404 });
  }
}
