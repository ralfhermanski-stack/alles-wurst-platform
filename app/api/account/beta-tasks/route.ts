import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import {
  acceptBetaInviteForUser,
  completeBetaTaskForUser,
  listBetaTasksForUser,
  reopenBetaTaskForUser,
} from "@/lib/beta-test/beta-test-service";
import { parseJsonBody } from "@/lib/tools/recipe-api-utils";

export async function GET(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Anmeldung erforderlich." },
    });
  }

  const tasks = await listBetaTasksForUser(userId);

  return Response.json({ success: true, data: { tasks } });
}

export async function POST(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Anmeldung erforderlich." },
    });
  }

  const body = await parseJsonBody(request);
  const token = typeof body?.token === "string" ? body.token.trim() : "";

  if (!token) {
    return jsonFromAuthResult({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Token fehlt." },
    });
  }

  const result = await acceptBetaInviteForUser({ token, userId });

  if (!result.ok) {
    return jsonFromAuthResult({
      success: false,
      error: { code: "VALIDATION_ERROR", message: result.message },
    });
  }

  const tasks = await listBetaTasksForUser(userId);

  return Response.json({ success: true, data: { message: result.message, tasks } });
}

export async function PATCH(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromAuthResult({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Anmeldung erforderlich." },
    });
  }

  const body = await parseJsonBody(request);
  const taskId = typeof body?.taskId === "string" ? body.taskId : "";
  const status = typeof body?.status === "string" ? body.status : "";

  if (!taskId) {
    return jsonFromAuthResult({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Auftrag fehlt." },
    });
  }

  const task =
    status === "OPEN"
      ? await reopenBetaTaskForUser({ userId, taskId })
      : await completeBetaTaskForUser({ userId, taskId });

  if (!task) {
    return jsonFromAuthResult({
      success: false,
      error: { code: "NOT_FOUND", message: "Auftrag nicht gefunden." },
    });
  }

  return Response.json({ success: true, data: task });
}
