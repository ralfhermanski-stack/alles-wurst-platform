import { assertAccountingAccessFromRequest } from "@/lib/accounting/accounting-auth";
import { parseCreatePositionBody } from "@/lib/accounting/accounting-position-parser";
import { createAccountingPosition } from "@/lib/accounting/accounting-position-service";
import {
  jsonFromAccountingResult,
  parseJsonBody,
} from "@/lib/accounting/accounting-api-utils";
import { userFailure } from "@/lib/users/user-errors";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * POST /api/accounting/users/[id]/positions — Manuelle Position anlegen.
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

  const input = parseCreatePositionBody(body);

  if (!input) {
    return jsonFromAccountingResult(
      userFailure({
        code: "VALIDATION_ERROR",
        message:
          "Pflichtfelder fehlen: productType, productName, grossAmount, netAmount, taxRate, taxAmount.",
      }),
    );
  }

  const { id } = await context.params;
  const result = await createAccountingPosition(access.data, id, input);

  return jsonFromAccountingResult(result);
}
