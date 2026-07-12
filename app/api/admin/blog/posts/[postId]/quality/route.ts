import {
  blogGuardResponse,
  jsonBlogError,
  jsonBlogSuccess,
} from "@/lib/blog/blog-api-utils";
import { getBlogQualityReport } from "@/lib/blog/blog-admin-service";

type RouteContext = { params: Promise<{ postId: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await blogGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { postId } = await context.params;
  const report = await getBlogQualityReport(postId);

  if (!report) {
    return jsonBlogError("Artikel nicht gefunden.", "NOT_FOUND");
  }

  return jsonBlogSuccess(report);
}
