import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { jsonAuthSuccess, jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { userFailure } from "@/lib/users/user-errors";
import { prisma } from "@/lib/db/prisma";
import { startTotpSetup } from "@/lib/security/totp-service";

export async function POST(request: Request) {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult(
      userFailure({ code: "UNAUTHORIZED", message: "Anmeldung erforderlich." }),
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) {
    return jsonFromAuthResult(
      userFailure({ code: "UNAUTHORIZED", message: "Anmeldung erforderlich." }),
    );
  }

  const setup = await startTotpSetup(userId, user.email);
  return jsonAuthSuccess(setup);
}
