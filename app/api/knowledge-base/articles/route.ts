import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { searchPublishedKnowledgeBaseArticles } from "@/lib/knowledge-base/knowledge-base-service";

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") ?? "";
  const categorySlug = url.searchParams.get("category") ?? undefined;
  const userId = await getSessionUserIdFromRequest(request);

  const result = await searchPublishedKnowledgeBaseArticles(query, {
    categorySlug,
    userId,
    sourcePage: "/hilfe/wissen",
  });

  return jsonFromAuthResult({ success: true, data: result });
}
