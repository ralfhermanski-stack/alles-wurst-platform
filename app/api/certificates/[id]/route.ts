import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { issueCertificateOnFirstAccess } from "@/lib/certificates/certificate-issue-service";
import { jsonFromCertificateResult } from "@/lib/certificates/certificate-api-utils";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromCertificateResult({
      success: false,
      error: { code: "FORBIDDEN", message: "Anmeldung erforderlich." },
    });
  }

  const { id } = await context.params;
  const result = await issueCertificateOnFirstAccess(id, userId);

  return jsonFromCertificateResult(result);
}
