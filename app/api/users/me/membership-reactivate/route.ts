import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { userReactivateMembership } from "@/lib/membership/membership-renewal-service";
import { userFailure, userSuccess } from "@/lib/users/user-errors";

export async function POST(request: Request) {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult(
      userFailure({ code: "FORBIDDEN", message: "Nicht angemeldet." }),
    );
  }

  const result = await userReactivateMembership(userId);

  if (!result.success) {
    return jsonFromAuthResult(
      userFailure({ code: "VALIDATION_ERROR", message: result.message }),
    );
  }

  return jsonFromAuthResult(userSuccess(result));
}
