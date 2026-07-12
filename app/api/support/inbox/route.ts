import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  getUserSupportInbox,
} from "@/lib/support/support-ticket-service";
import { requireSupportUser } from "@/lib/support/support-api-utils";

export async function GET(request: Request): Promise<Response> {
  const auth = await requireSupportUser(request);

  if (auth instanceof Response) {
    return auth;
  }

  const inbox = await getUserSupportInbox(auth.userId);

  return jsonFromAuthResult({ success: true, data: inbox });
}
