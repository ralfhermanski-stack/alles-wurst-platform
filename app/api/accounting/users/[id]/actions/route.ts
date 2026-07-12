import { assertAccountingAccessFromRequest } from "@/lib/accounting/accounting-auth";
import { parseAccountingAction } from "@/lib/accounting/accounting-action-parser";
import {
  jsonFromAccountingResult,
  parseJsonBody,
} from "@/lib/accounting/accounting-api-utils";
import { executeAccountingMembershipAction } from "@/lib/accounting/accounting-service";
import { userFailure } from "@/lib/users/user-errors";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/accounting/users/[id]/actions — Buchhaltungsaktion ausführen.
 */
export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertAccountingAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAccountingResult(access);
  }

  const body = await parseJsonBody(request);

  if (!body) {
    return jsonFromAccountingResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "Ungültiger JSON-Body.",
      }),
    );
  }

  const action = parseAccountingAction(body);

  if (!action) {
    return jsonFromAccountingResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message: "Unbekannte oder unvollständige Buchhaltungsaktion.",
      }),
    );
  }

  const { id } = await context.params;
  const result = await executeAccountingMembershipAction(
    access.data,
    id,
    action,
  );

  return jsonFromAccountingResult(result);
}
