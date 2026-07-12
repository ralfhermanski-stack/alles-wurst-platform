import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { reissueCertificate } from "@/lib/certificates/certificate-issue-service";
import { jsonFromCertificateResult } from "@/lib/certificates/certificate-api-utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const { id } = await context.params;
  const result = await reissueCertificate(id);

  return jsonFromCertificateResult(result);
}
