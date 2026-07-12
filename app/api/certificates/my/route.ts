import { getSessionUserIdFromRequest } from "@/lib/auth/session";
import { listUserCertificates } from "@/lib/certificates/certificate-issue-service";
import { jsonFromCertificateResult } from "@/lib/certificates/certificate-api-utils";

export async function GET(request: Request): Promise<Response> {
  const userId = await getSessionUserIdFromRequest(request);

  if (!userId) {
    return jsonFromCertificateResult({
      success: false,
      error: { code: "FORBIDDEN", message: "Anmeldung erforderlich." },
    });
  }

  const certificates = await listUserCertificates(userId);

  return jsonFromCertificateResult({ success: true, data: certificates });
}
