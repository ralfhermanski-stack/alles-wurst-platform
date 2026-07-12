import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  createKnowledgeBaseArticle,
  listAdminKnowledgeBaseArticles,
} from "@/lib/knowledge-base/knowledge-base-service";
import type { KnowledgeBaseArticleStatus } from "@prisma/client";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const url = new URL(request.url);
  const status = url.searchParams.get("status") as
    | KnowledgeBaseArticleStatus
    | "all"
    | null;
  const categoryId = url.searchParams.get("categoryId") ?? undefined;
  const query = url.searchParams.get("q") ?? undefined;

  const articles = await listAdminKnowledgeBaseArticles({
    status: status ?? "all",
    categoryId,
    query,
  });

  return jsonFromAuthResult({ success: true, data: articles });
}

export async function POST(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const body = (await request.json()) as Record<string, unknown>;
  const result = await createKnowledgeBaseArticle({
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
        : "draft",
    visibility: body.visibility === "members" ? "members" : "public",
    sortOrder:
      typeof body.sortOrder === "number" ? body.sortOrder : undefined,
  });

  return jsonFromAuthResult(result);
}
