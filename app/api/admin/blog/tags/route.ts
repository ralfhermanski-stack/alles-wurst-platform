import {
  assertBlogAccessFromRequest,
  blogGuardResponse,
  jsonBlogError,
  jsonBlogSuccess,
  parseBlogJsonBody,
} from "@/lib/blog/blog-api-utils";
import { listBlogTags, upsertBlogTag } from "@/lib/blog/blog-admin-service";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";

export async function GET(request: Request): Promise<Response> {
  const denied = await blogGuardResponse(request);

  if (denied) {
    return denied;
  }

  const tags = await listBlogTags();
  return jsonBlogSuccess(tags);
}

export async function POST(request: Request): Promise<Response> {
  const denied = await blogGuardResponse(request);

  if (denied) {
    return denied;
  }

  const access = await assertBlogAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const bodyResult = await parseBlogJsonBody<{ name?: string }>(request);

  if (!bodyResult.success) {
    return bodyResult.response;
  }

  try {
    const tag = await upsertBlogTag(access.data.systemRole, bodyResult.data.name ?? "");
    return jsonBlogSuccess(tag);
  } catch (error) {
    return jsonBlogError(error instanceof Error ? error.message : "Fehler beim Speichern.");
  }
}
