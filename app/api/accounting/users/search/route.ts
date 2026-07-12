import { assertAccountingAccessFromRequest } from "@/lib/accounting/accounting-auth";
import { jsonFromAccountingResult } from "@/lib/accounting/accounting-api-utils";
import { searchAccountingUsers } from "@/lib/accounting/accounting-service";
import { userFailure } from "@/lib/users/user-errors";

/**
 * GET /api/accounting/users/search?q=...
 */
export async function GET(request: Request): Promise<Response> {
  const access = await assertAccountingAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAccountingResult(access);
  }

  const query = new URL(request.url).searchParams.get("q") ?? "";

  if (!query.trim()) {
    return jsonFromAccountingResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "Suchbegriff (q) ist erforderlich.",
      }),
    );
  }

  const result = await searchAccountingUsers(query);

  return jsonFromAccountingResult(result);
}
