import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  createSupportAttachmentRecord,
  getUserSupportTicketDetail,
} from "@/lib/support/support-ticket-service";
import { requireSupportUser } from "@/lib/support/support-api-utils";
import {
  getMaxAttachmentBytes,
  getMaxAttachmentsPerMessage,
  isAllowedSupportAttachment,
  saveSupportAttachment,
} from "@/lib/support/support-attachment-storage";
import { userFailure } from "@/lib/users/user-errors";

type RouteContext = { params: Promise<{ ticketNumber: string }> };

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const userId = await (async () => {
    const auth = await requireSupportUser(request);

    if (auth instanceof Response) {
      return auth;
    }

    return auth.userId;
  })();

  if (userId instanceof Response) {
    return userId;
  }

  const { ticketNumber } = await context.params;
  const ticketResult = await getUserSupportTicketDetail(userId, ticketNumber);

  if (!ticketResult.success) {
    return jsonFromAuthResult(ticketResult);
  }

  const formData = await request.formData();
  const files = formData.getAll("files").filter((entry) => entry instanceof File);

  if (files.length === 0) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "Keine Datei ausgewählt.",
      }),
    );
  }

  if (files.length > getMaxAttachmentsPerMessage()) {
    return jsonFromAuthResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: `Maximal ${getMaxAttachmentsPerMessage()} Dateien pro Upload.`,
      }),
    );
  }

  const attachments = [];

  for (const file of files) {
    if (file.size > getMaxAttachmentBytes()) {
      return jsonFromAuthResult(
        userFailure({
          code: "VALIDATION_ERROR",
          message: "Datei ist zu groß (max. 10 MB).",
        }),
      );
    }

    if (!isAllowedSupportAttachment(file.name, file.type)) {
      return jsonFromAuthResult(
        userFailure({
          code: "VALIDATION_ERROR",
          message: "Dateityp nicht erlaubt.",
        }),
      );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const saved = await saveSupportAttachment(
      ticketResult.data.id,
      file.name,
      bytes,
    );

    attachments.push(
      await createSupportAttachmentRecord({
        ticketId: ticketResult.data.id,
        uploadedByUserId: userId,
        storageKey: saved.storageKey,
        fileName: saved.fileName,
        mimeType: file.type || "application/octet-stream",
        sizeBytes: file.size,
      }),
    );
  }

  return jsonFromAuthResult({ success: true, data: attachments });
}
