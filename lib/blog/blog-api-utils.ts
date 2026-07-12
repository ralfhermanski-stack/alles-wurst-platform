/**
 * @file blog-api-utils.ts
 * @purpose API-Hilfen für Blog-Routen.
 */

import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { assertBlogAccessFromRequest } from "@/lib/blog/blog-auth";

export { assertBlogAccessFromRequest };

export async function blogGuardResponse(request: Request): Promise<Response | null> {
  const access = await assertBlogAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  return null;
}

export async function parseBlogJsonBody<T extends Record<string, unknown>>(
  request: Request,
): Promise<{ success: true; data: T } | { success: false; response: Response }> {
  try {
    const data = (await request.json()) as T;
    return { success: true, data };
  } catch {
    return {
      success: false,
      response: jsonFromAuthResult({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Ungültiger JSON-Body.",
        },
      }),
    };
  }
}

export function jsonBlogSuccess<T>(data: T): Response {
  return jsonFromAuthResult({ success: true, data });
}

export function jsonBlogError(
  message: string,
  code: "VALIDATION_ERROR" | "NOT_FOUND" | "FORBIDDEN" = "VALIDATION_ERROR",
): Response {
  return jsonFromAuthResult({
    success: false,
    error: { code, message },
  });
}
