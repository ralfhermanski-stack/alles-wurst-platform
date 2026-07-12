import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { listSupportCategoriesForUser } from "@/lib/support/support-ticket-service";

export async function GET(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);
  const categories = await listSupportCategoriesForUser(userId);

  return jsonFromAuthResult({ success: true, data: categories });
}
