import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { hasAdminPermission } from "@/lib/admin/admin-permissions";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  createBetaInvite,
  listBetaInvites,
} from "@/lib/beta-test/beta-test-service";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

function readTasks(body: Record<string, unknown>) {
  const raw = body.tasks;

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .filter((entry): entry is Record<string, unknown> => typeof entry === "object" && entry !== null)
    .map((entry) => ({
      title: typeof entry.title === "string" ? entry.title : "",
      description:
        typeof entry.description === "string" ? entry.description : null,
      dueAt: typeof entry.dueAt === "string" ? entry.dueAt : null,
    }));
}

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  try {
    const invites = await listBetaInvites();

    return Response.json({ success: true, data: { invites } });
  } catch (error) {
    console.error("[admin/beta-test/invites] GET failed:", error);

    return jsonFromAuthResult({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Einladungen konnten nicht geladen werden.",
      },
    });
  }
}

export async function POST(request: Request): Promise<Response> {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  if (!hasAdminPermission(access.data.systemRole, "maintenance.bypass")) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "FORBIDDEN",
        message: "Keine Berechtigung für Betatest-Einladungen.",
      },
    });
  }

  const body = await parseJsonBody(request);

  if (!body) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Ungültiger JSON-Body.",
      },
    });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const personalMessage =
    typeof body.personalMessage === "string" ? body.personalMessage : null;

  if (!email) {
    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "E-Mail-Adresse ist erforderlich.",
      },
    });
  }

  try {
    const result = await createBetaInvite({
      email,
      personalMessage,
      tasks: readTasks(body),
      invitedByUserId: access.data.userId,
    });

    return Response.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("[admin/beta-test/invites] POST failed:", error);

    return jsonFromAuthResult({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Einladung konnte nicht erstellt werden.",
      },
    });
  }
}
