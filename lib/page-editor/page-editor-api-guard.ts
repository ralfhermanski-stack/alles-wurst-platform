/**
 * @file page-editor-api-guard.ts
 */

import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import type { AdminActor } from "@/lib/admin/admin-types";

import { canAccessContentAdmin } from "./page-editor-auth";
import { jsonFromPageEditorResult } from "./page-editor-api-utils";

export async function assertPageEditorApiAccess(
  request: Request,
): Promise<{ ok: true; actor: AdminActor } | { ok: false; response: Response }> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return { ok: false, response: denied };
  }

  const access = await assertAdminAccessFromRequest(request);

  if (!access.success || !canAccessContentAdmin(access.data.systemRole)) {
    return {
      ok: false,
      response: jsonFromPageEditorResult({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Du hast keine Berechtigung, Inhalte zu bearbeiten.",
        },
      }),
    };
  }

  return { ok: true, actor: access.data };
}
