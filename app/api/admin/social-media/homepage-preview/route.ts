import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { getHomepageSocialCards } from "@/lib/social-media/social-media-homepage-service";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const cards = await getHomepageSocialCards();

  return jsonFromAuthResult({ success: true, data: cards });
}
