import { assertAccountingAccessFromRequest } from "@/lib/accounting/accounting-auth";
import { jsonFromAccountingResult } from "@/lib/accounting/accounting-api-utils";
import { createCreditNoteFromInvoice } from "@/lib/invoices/credit-note-service";

type RouteContext = {
  params: Promise<{ invoiceId: string }>;
};

/**
 * POST /api/accounting/invoices/[invoiceId]/credit-note
 * Gutschrift zu einer Rechnung erstellen.
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
  const result = await createCreditNoteFromInvoice(access.data, invoiceId);

  return jsonFromAccountingResult(result);
}
