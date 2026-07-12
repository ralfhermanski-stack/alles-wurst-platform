import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { listAdminLegalDocuments } from "@/lib/legal/legal-document-service";
import { getLegalAdminOverview } from "@/lib/legal/legal-admin-service";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const url = new URL(request.url);
  const view = url.searchParams.get("view");

  if (view === "overview") {
    const overview = await getLegalAdminOverview();
    return jsonFromAuthResult({ success: true, data: overview });
  }

  const documents = await listAdminLegalDocuments();
  return jsonFromAuthResult({ success: true, data: documents });
}
