import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { hasAdminPermission } from "@/lib/admin/admin-permissions";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  addTasksToBetaInvite,
  getBetaInviteDetail,
  resendBetaInvite,
  revokeBetaInvite,
} from "@/lib/beta-test/beta-test-service";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

type RouteContext = {
  params: Promise<{ inviteId: string }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { inviteId } = await context.params;
  const invite = await getBetaInviteDetail(inviteId);

  if (!invite) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Einladung nicht gefunden.",
      },
    });
  }

  return Response.json({ success: true, data: invite });
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  if (!hasAdminPermission(access.data.systemRole, "maintenance.bypass")) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Keine Berechtigung.",
      },
    });
  }

  const { inviteId } = await context.params;
  const body = await parseJsonBody(request);
  const action = typeof body?.action === "string" ? body.action : "resend";

  try {
    if (action === "revoke") {
      await revokeBetaInvite(inviteId);
      const invite = await getBetaInviteDetail(inviteId);
      return Response.json({ success: true, data: invite });
    }

    await resendBetaInvite(inviteId);
    const invite = await getBetaInviteDetail(inviteId);

    return Response.json({ success: true, data: invite });
  } catch (error) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message:
          error instanceof Error ? error.message : "Aktion fehlgeschlagen.",
      },
    });
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  if (!hasAdminPermission(access.data.systemRole, "maintenance.bypass")) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Keine Berechtigung.",
      },
    });
  }

  const { inviteId } = await context.params;
  const body = await parseJsonBody(request);

  if (!body || !Array.isArray(body.tasks)) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Aufträge fehlen.",
      },
    });
  }

  try {
    const invite = await addTasksToBetaInvite({
      inviteId,
      tasks: body.tasks
        .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
        .map((entry) => ({
          title: typeof entry.title === "string" ? entry.title : "",
          description:
            typeof entry.description === "string" ? entry.description : null,
          dueAt: typeof entry.dueAt === "string" ? entry.dueAt : null,
        })),
      assignedByUserId: access.data.userId,
    });

    return Response.json({ success: true, data: invite });
  } catch (error) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message:
          error instanceof Error ? error.message : "Aufträge konnten nicht gespeichert werden.",
      },
    });
  }
}
