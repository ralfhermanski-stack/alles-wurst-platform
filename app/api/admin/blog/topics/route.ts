import { blogGuardResponse, jsonBlogSuccess } from "@/lib/blog/blog-api-utils";
import { listBlogTopics } from "@/lib/blog/blog-admin-service";

export async function GET(request: Request): Promise<Response> {
  const denied = await blogGuardResponse(request);

  if (denied) {
    return denied;
  }

  const topics = await listBlogTopics();
  return jsonBlogSuccess(topics);
}
