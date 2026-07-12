import { assertAccountingAccessFromRequest } from "@/lib/accounting/accounting-auth";
import { jsonFromAccountingResult } from "@/lib/accounting/accounting-api-utils";
import { createInvoiceFromPosition } from "@/lib/invoices/invoice-service";

type RouteContext = {
  params: Promise<{ id: string; positionId: string }>;
};

/**
 * POST /api/accounting/users/[id]/positions/[positionId]/invoice
 * Rechnung aus Buchhaltungsposition erzeugen.
 */
export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertAccountingAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAccountingResult(access);
  }

  const { id: userId, positionId } = await context.params;
  const result = await createInvoiceFromPosition(
    access.data,
    userId,
    positionId,
  );

  return jsonFromAccountingResult(result);
}
