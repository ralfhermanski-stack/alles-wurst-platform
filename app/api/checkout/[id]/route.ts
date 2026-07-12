import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { getCheckoutDetailsForUser } from "@/lib/payments/checkout-query-service";
import { jsonFromCheckoutResult } from "@/lib/payments/checkout-api-utils";
import { userFailure } from "@/lib/users/user-errors";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/checkout/[id] — Checkout-Status für eingeloggten Nutzer.
 */
export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromCheckoutResult(
      userFailure({
        code: "FORBIDDEN",
        message: "Bitte melde dich an, um den Checkout-Status zu sehen.",
      }),
    );
  }

  const { id } = await context.params;
  const result = await getCheckoutDetailsForUser(id, userId);

  return jsonFromCheckoutResult(result);
}
