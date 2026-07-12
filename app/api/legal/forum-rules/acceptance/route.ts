import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { jsonFromCourseResult, parseCourseJsonBody } from "@/lib/courses/course-api-utils";
import {
  ensureDefaultLegalDocuments,
} from "@/lib/legal/legal-document-service";
import {
  getForumRulesAcceptanceStatus,
  recordForumRulesAcceptance,
} from "@/lib/legal/legal-acceptance-service";

export async function GET(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromCourseResult({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Anmeldung erforderlich." },
    });
  }

  await ensureDefaultLegalDocuments();
  const status = await getForumRulesAcceptanceStatus(userId);

  return jsonFromCourseResult({ success: true, data: status });
}

export async function POST(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromCourseResult({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Anmeldung erforderlich." },
    });
  }

  const bodyResult = await parseCourseJsonBody(request);

  if (!bodyResult.success) {
    return jsonFromCourseResult(bodyResult);
  }

  const accepted = bodyResult.data.accepted === true;

  if (!accepted) {
    return jsonFromCourseResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Die Zustimmung zu den Forenregeln ist erforderlich.",
      },
    });
  }

  await ensureDefaultLegalDocuments();
  const result = await recordForumRulesAcceptance(userId);

  return jsonFromCourseResult(result);
}
