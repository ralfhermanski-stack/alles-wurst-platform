import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { testStripeApiKeys } from "@/lib/stripe/stripe-admin-service";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";
import type { StripeActiveMode } from "@prisma/client";

export async function POST(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const body = (await parseJsonBody(request)) as {
    mode?: StripeActiveMode;
  } | null;
  const mode =
    body?.mode === "live" || body?.mode === "test" ? body.mode : undefined;

  try {
    const result = await testStripeApiKeys(mode);

    return Response.json({ success: true, data: result });
  } catch (error) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "API-Test fehlgeschlagen.",
      },
    });
  }
}
