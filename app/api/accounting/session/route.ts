import { assertAccountingAccessFromCookies } from "@/lib/accounting/accounting-auth";
import { jsonFromAccountingResult } from "@/lib/accounting/accounting-api-utils";

/**
 * GET /api/accounting/session — Prüft Buchhaltungs-Zugriff.
 */
export async function GET(): Promise<Response> {
  const result = await assertAccountingAccessFromCookies();

  return jsonFromAccountingResult(result);
}
