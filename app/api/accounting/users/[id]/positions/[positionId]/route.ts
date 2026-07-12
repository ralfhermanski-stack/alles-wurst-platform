import { assertAccountingAccessFromRequest } from "@/lib/accounting/accounting-auth";
import { parsePositionActionBody } from "@/lib/accounting/accounting-position-parser";
import { updateAccountingPositionStatus } from "@/lib/accounting/accounting-position-service";
import {
  jsonFromAccountingResult,
  parseJsonBody,
} from "@/lib/accounting/accounting-api-utils";
import { userFailure } from "@/lib/users/user-errors";

type RouteContext = { params: Promise<{ id: string; positionId: string }> };

/**
 * PATCH /api/accounting/users/[id]/positions/[positionId] — Status ändern.
 */
export async function PATCH(
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

  const input = parsePositionActionBody(body);

  if (!input) {
    return jsonFromAccountingResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message:
          "Unbekannte Aktion oder ungültiger Zahlungsstatus. Erlaubt: mark_paid, mark_pending, mark_overdue, mark_cancelled.",
      }),
    );
  }

  const { id, positionId } = await context.params;
  const result = await updateAccountingPositionStatus(
    access.data,
    id,
    positionId,
    input,
  );

  return jsonFromAccountingResult(result);
}
