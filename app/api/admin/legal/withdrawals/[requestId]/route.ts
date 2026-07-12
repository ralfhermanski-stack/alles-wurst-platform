import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { updateWithdrawalStatus } from "@/lib/legal/legal-withdrawal-service";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

type RouteContext = {
  params: Promise<{ requestId: string }>;
};

const ALLOWED_STATUSES = [
  "UNDER_REVIEW",
  "ADDITIONAL_INFORMATION_REQUIRED",
  "ACCEPTED",
  "PARTIALLY_ACCEPTED",
  "REJECTED",
  "REFUNDED",
  "CLOSED",
] as const;

type AllowedWithdrawalStatus = (typeof ALLOWED_STATUSES)[number];

function isAllowedWithdrawalStatus(
  value: string,
): value is AllowedWithdrawalStatus {
  return (ALLOWED_STATUSES as readonly string[]).includes(value);
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const adminUserId = await getSessionUserIdFromRequest(request);

  if (!adminUserId) {
    return jsonFromAuthResult({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Nicht angemeldet." },
    });
  }

  const { requestId } = await context.params;
  const body = await parseJsonBody(request);
  const status =
    body && typeof body.status === "string" ? body.status : null;

  if (!status || !isAllowedWithdrawalStatus(status)) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Ungültiger Status.",
      },
    });
  }

  const result = await updateWithdrawalStatus({
    requestId,
    status,
    adminUserId,
    rejectionReason:
      typeof body?.rejectionReason === "string" ? body.rejectionReason : null,
    legalBasisReference:
      typeof body?.legalBasisReference === "string"
        ? body.legalBasisReference
        : null,
    internalNotes:
      typeof body?.internalNotes === "string" ? body.internalNotes : null,
    stripeRefundId:
      typeof body?.stripeRefundId === "string" ? body.stripeRefundId : null,
  });

  if (!result.success) {
    return jsonFromAuthResult(result);
  }

  return jsonFromAuthResult({ success: true, data: true });
}
