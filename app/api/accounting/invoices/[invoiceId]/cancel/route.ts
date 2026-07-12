import { assertAccountingAccessFromRequest } from "@/lib/accounting/accounting-auth";
import { jsonFromAccountingResult } from "@/lib/accounting/accounting-api-utils";
import { cancelInvoice } from "@/lib/invoices/invoice-service";

type RouteContext = {
  params: Promise<{ invoiceId: string }>;
};

/**
 * POST /api/accounting/invoices/[invoiceId]/cancel
 * Rechnung stornieren (Original bleibt erhalten).
 */
export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertAccountingAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAccountingResult(access);
  }

  const { invoiceId } = await context.params;
  const result = await cancelInvoice(access.data, invoiceId);

  return jsonFromAccountingResult(result);
}
