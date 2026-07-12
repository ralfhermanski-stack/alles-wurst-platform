import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { listKnowledgeBaseCategories } from "@/lib/knowledge-base/knowledge-base-service";

export async function GET(): Promise<Response> {
  const categories = await listKnowledgeBaseCategories();

  return jsonFromAuthResult({ success: true, data: categories });
}
