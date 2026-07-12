import { assertAccountingAccessFromRequest } from "@/lib/accounting/accounting-auth";
import { getAccountingUserDetail } from "@/lib/accounting/accounting-service";
import { jsonFromAccountingResult } from "@/lib/accounting/accounting-api-utils";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/accounting/users/[id] — Nutzerdetail mit Audit-Verlauf.
 */
export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertAccountingAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAccountingResult(access);
  }

  const { id } = await context.params;
  const result = await getAccountingUserDetail(id);

  return jsonFromAccountingResult(result);
}
