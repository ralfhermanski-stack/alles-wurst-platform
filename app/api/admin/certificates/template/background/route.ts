import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import { updateCertificateTemplate } from "@/lib/certificates/certificate-template-service";
import { jsonFromCertificateResult } from "@/lib/certificates/certificate-api-utils";
import { saveCertificateBackground } from "@/lib/certificates/certificate-storage";
import { isCertificateKind } from "@/lib/certificates/certificate-types";

export async function POST(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const url = new URL(request.url);
  const kindParam = url.searchParams.get("kind");
  const kind = isCertificateKind(kindParam) ? kindParam : "certificate";

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return jsonFromCertificateResult({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Bilddatei ist erforderlich." },
    });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const saved = await saveCertificateBackground(file.name, bytes);

  const result = await updateCertificateTemplate(kind, {
    backgroundStorageKey: saved.storageKey,
    backgroundFileName: saved.fileName,
  });

  return jsonFromCertificateResult(result);
}
