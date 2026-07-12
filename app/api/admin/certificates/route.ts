import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { listAllCertificatesForAdmin } from "@/lib/certificates/certificate-issue-service";
import { jsonFromCertificateResult } from "@/lib/certificates/certificate-api-utils";

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const certificates = await listAllCertificatesForAdmin();

  return jsonFromCertificateResult({ success: true, data: certificates });
}
