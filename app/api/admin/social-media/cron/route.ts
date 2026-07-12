import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { getCronDiagnostics } from "@/lib/social-media/social-media-system-status";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const diagnostics = await getCronDiagnostics();

  return jsonFromAuthResult({ success: true, data: diagnostics });
}
