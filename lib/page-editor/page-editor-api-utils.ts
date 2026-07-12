/**
 * @file page-editor-api-utils.ts
 */

import { jsonFromServiceResult } from "@/lib/tools/recipe-api-utils";
import type { PlatformTextServiceResult } from "@/lib/platform-text/platform-text-types";

export function jsonFromPageEditorResult<T>(
  result: PlatformTextServiceResult<T>,
  statusOverrides?: Partial<Record<string, number>>,
): Response {
  const defaultStatus: Record<string, number> = {
    NOT_FOUND: 404,
    FORBIDDEN: 403,
    UNAUTHORIZED: 401,
    VALIDATION_ERROR: 400,
    RATE_LIMITED: 429,
    ...statusOverrides,
  };

  if (!result.success) {
    const status = defaultStatus[result.error.code] ?? 500;
    return Response.json(
      { success: false, error: result.error },
      { status },
    );
  }

  return Response.json({ success: true, data: result.data });
}

export { jsonFromServiceResult };
