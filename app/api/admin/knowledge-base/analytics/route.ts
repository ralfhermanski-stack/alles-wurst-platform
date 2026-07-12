import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { getKnowledgeBaseAnalyticsSummary } from "@/lib/knowledge-base/knowledge-base-service";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const summary = await getKnowledgeBaseAnalyticsSummary();

  return jsonFromAuthResult({ success: true, data: summary });
}
