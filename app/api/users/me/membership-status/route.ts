import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { buildUserMembershipStatus } from "@/lib/membership/membership-renewal-service";
import { userFailure, userSuccess } from "@/lib/users/user-errors";

export async function GET(request: Request) {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult(
      userFailure({ code: "FORBIDDEN", message: "Nicht angemeldet." }),
    );
  }

  const status = await buildUserMembershipStatus(userId);

  if (!status) {
    return jsonFromAuthResult(
      userFailure({ code: "NOT_FOUND", message: "Keine Mitgliedschaft." }),
    );
  }

  return jsonFromAuthResult(userSuccess(status));
}
