import {
  assertBlogAccessFromRequest,
  blogGuardResponse,
  jsonBlogError,
  jsonBlogSuccess,
  parseBlogJsonBody,
} from "@/lib/blog/blog-api-utils";
import {
  createBlogCategory,
  listBlogCategories,
} from "@/lib/blog/blog-admin-service";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";

export async function GET(request: Request): Promise<Response> {
  const denied = await blogGuardResponse(request);

  if (denied) {
    return denied;
  }

  const categories = await listBlogCategories(false);
  return jsonBlogSuccess(categories);
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

  const bodyResult = await parseBlogJsonBody<{
    name?: string;
    slug?: string;
    description?: string | null;
  }>(request);

  if (!bodyResult.success) {
    return bodyResult.response;
  }

  try {
    const category = await createBlogCategory(access.data.systemRole, {
      name: bodyResult.data.name ?? "",
      slug: bodyResult.data.slug,
      description: bodyResult.data.description,
    });

    return jsonBlogSuccess(category);
  } catch (error) {
    return jsonBlogError(error instanceof Error ? error.message : "Fehler beim Anlegen.");
  }
}
