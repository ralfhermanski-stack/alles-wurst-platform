import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { assertBlogAccessFromRequest } from "@/lib/blog/blog-auth";

export async function GET(request: Request): Promise<Response> {
  const access = await assertBlogAccessFromRequest(request);
  return jsonFromAuthResult(access);
}
