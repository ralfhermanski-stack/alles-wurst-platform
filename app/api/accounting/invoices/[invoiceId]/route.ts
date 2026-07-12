import { assertAccountingAccessFromRequest } from "@/lib/accounting/accounting-auth";
import { jsonFromAccountingResult } from "@/lib/accounting/accounting-api-utils";
import { getInvoicePrintData } from "@/lib/invoices/invoice-service";

type RouteContext = {
  params: Promise<{ invoiceId: string }>;
};

/**
 * GET /api/accounting/invoices/[invoiceId] — Rechnungsdaten für Druckansicht.
 */
export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertAccountingAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAccountingResult(access);
  }

  const { invoiceId } = await context.params;
  const result = await getInvoicePrintData(invoiceId);

  return jsonFromAccountingResult(result);
}
