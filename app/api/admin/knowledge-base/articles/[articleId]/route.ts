import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  archiveKnowledgeBaseArticle,
  getAdminKnowledgeBaseArticle,
  updateKnowledgeBaseArticle,
} from "@/lib/knowledge-base/knowledge-base-service";
import { userFailure } from "@/lib/users/user-errors";

type RouteContext = { params: Promise<{ articleId: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { articleId } = await context.params;
  const article = await getAdminKnowledgeBaseArticle(articleId);

  if (!article) {
    return jsonFromAuthResult(
      userFailure({
        code: "NOT_FOUND",
        message: "FAQ nicht gefunden.",
      }),
    );
  }

  return jsonFromAuthResult({ success: true, data: article });
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { articleId } = await context.params;
  const body = (await request.json()) as Record<string, unknown>;

  const result = await updateKnowledgeBaseArticle(articleId, {
    title: String(body.title ?? ""),
    slug: typeof body.slug === "string" ? body.slug : undefined,
    summary: typeof body.summary === "string" ? body.summary : null,
    content: String(body.content ?? ""),
    categoryId: String(body.categoryId ?? ""),
    keywords: Array.isArray(body.keywords)
      ? body.keywords.map((entry) => String(entry))
      : [],
    status:
      body.status === "published" ||
      body.status === "draft" ||
      body.status === "archived"
        ? body.status
        : undefined,
    visibility: body.visibility === "members" ? "members" : "public",
    sortOrder:
      typeof body.sortOrder === "number" ? body.sortOrder : undefined,
  });

  return jsonFromAuthResult(result);
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { articleId } = await context.params;
  const result = await archiveKnowledgeBaseArticle(articleId);

  return jsonFromAuthResult(result);
}
