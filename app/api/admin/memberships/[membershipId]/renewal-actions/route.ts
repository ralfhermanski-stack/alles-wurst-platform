import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import {
  reenableMembershipAutoRenew,
  scheduleMembershipCancelAtPeriodEnd,
  sendMembershipRenewalReminder,
} from "@/lib/membership/membership-renewal-service";
import { parseJsonBody, getStringField } from "@/lib/tools/recipe-api-utils";
import { userFailure, userSuccess } from "@/lib/users/user-errors";

import { prisma } from "@/lib/db/prisma";

type RenewalAction =
  | "cancel_at_period_end"
  | "reenable_auto_renew"
  | "send_reminder"
  | "suppress_reminders";

export async function POST(
  request: Request,
  context: { params: Promise<{ membershipId: string }> },
) {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const { membershipId } = await context.params;
  const body = await parseJsonBody(request);
  const action = body ? getStringField(body, "action") : null;

  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    select: { id: true, userId: true },
  });

  if (!membership) {
    return jsonFromAuthResult(
      userFailure({
        code: "NOT_FOUND",
        message: "Mitgliedschaft nicht gefunden.",
      }),
    );
  }

  switch (action as RenewalAction) {
    case "cancel_at_period_end": {
      const result = await scheduleMembershipCancelAtPeriodEnd({
        userId: membership.userId,
        reason: "admin",
        actorUserId: access.data.userId,
      });
      return jsonFromAuthResult(
        result.success
          ? userSuccess(result)
          : userFailure({ code: "VALIDATION_ERROR", message: result.message }),
      );
    }
    case "reenable_auto_renew": {
      const result = await reenableMembershipAutoRenew({
        userId: membership.userId,
        actorUserId: access.data.userId,
      });
      return jsonFromAuthResult(userSuccess(result));
    }
    case "send_reminder": {
      const result = await sendMembershipRenewalReminder({
        membershipId,
        triggeredBy: "admin_manual",
        actorUserId: access.data.userId,
        force: true,
      });
      return jsonFromAuthResult(userSuccess(result));
    }
    case "suppress_reminders": {
      await prisma.membership.update({
        where: { id: membershipId },
        data: { renewalRemindersSuppressed: true },
      });
      return jsonFromAuthResult(
        userSuccess({ message: "Verlängerungshinweise unterdrückt." }),
      );
    }
    default:
      return jsonFromAuthResult(
        userFailure({
          code: "VALIDATION_ERROR",
          message:
            "Unbekannte Aktion. Erlaubt: cancel_at_period_end, reenable_auto_renew, send_reminder, suppress_reminders.",
        }),
      );
  }
}
