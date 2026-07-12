import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import {
  createSupportTicket,
  listUserSupportTickets,
} from "@/lib/support/support-ticket-service";
import { requireSupportUser } from "@/lib/support/support-api-utils";
import { getStringField } from "@/lib/tools/recipe-api-utils";
import type { SupportTicketPriority } from "@prisma/client";

export async function GET(request: Request): Promise<Response> {
  const auth = await requireSupportUser(request);

  if (auth instanceof Response) {
    return auth;
  }

  const tickets = await listUserSupportTickets(auth.userId);

  return jsonFromAuthResult({ success: true, data: tickets });
}

export async function POST(request: Request): Promise<Response> {
  const auth = await requireSupportUser(request);

  if (auth instanceof Response) {
    return auth;
  }

  const bodyResult = await parseCourseJsonBody(request);

  if (!bodyResult.success) {
    return jsonFromAuthResult(bodyResult);
  }

  const body = bodyResult.data;
  const subject = getStringField(body, "subject");
  const categoryId = getStringField(body, "categoryId");
  const message = getStringField(body, "message");
  const priority =
    (getStringField(body, "priority") as SupportTicketPriority | null) ??
    "normal";

  if (!subject || !categoryId || !message) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Betreff, Kategorie und Nachricht sind erforderlich.",
      },
    });
  }

  const result = await createSupportTicket(auth.userId, {
    subject,
    categoryId,
    priority,
    message,
  });

  return jsonFromAuthResult(result);
}
