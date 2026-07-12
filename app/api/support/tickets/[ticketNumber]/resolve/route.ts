import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { markUserTicketResolved } from "@/lib/support/support-ticket-service";
import { requireSupportUser } from "@/lib/support/support-api-utils";

type RouteContext = { params: Promise<{ ticketNumber: string }> };

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const auth = await requireSupportUser(request);

  if (auth instanceof Response) {
    return auth;
  }

  const { ticketNumber } = await context.params;
  const result = await markUserTicketResolved(auth.userId, ticketNumber);

  return jsonFromAuthResult(result);
}
