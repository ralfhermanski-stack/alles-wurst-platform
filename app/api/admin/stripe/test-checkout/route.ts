import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  createStripeTestCheckout,
  findTestProductPrices,
} from "@/lib/stripe/stripe-admin-service";
import { parseJsonBody, getStringField } from "@/lib/tools/recipe-api-utils";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  try {
    const prices = await findTestProductPrices();

    return Response.json({ success: true, data: { prices } });
  } catch (error) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Produktpreise konnten nicht geladen werden.",
      },
    });
  }
}

export async function POST(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Admin-Session erforderlich.",
      },
    });
  }

  const body = await parseJsonBody(request);
  const productPriceId = body ? getStringField(body, "productPriceId") : null;

  if (!productPriceId) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "productPriceId ist erforderlich.",
      },
    });
  }

  try {
    const result = await createStripeTestCheckout({
      userId,
      productPriceId,
    });

    return Response.json({ success: true, data: result });
  } catch (error) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Test-Checkout konnte nicht erstellt werden.",
      },
    });
  }
}
