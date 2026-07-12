import { adminGuardResponse } from "@/lib/admin/admin-api-utils";
import {
  getCertificateTemplate,
  updateCertificateTemplate,
} from "@/lib/certificates/certificate-template-service";
import { jsonFromCertificateResult, parseCertificateJsonBody } from "@/lib/certificates/certificate-api-utils";
import {
  isCertificateFormat,
  isCertificateKind,
  parseFreeTextFields,
  parsePlaceholderFields,
  parseQrConfig,
} from "@/lib/certificates/certificate-types";

function resolveKind(request: Request): "certificate" | "participation" {
  const kindParam = new URL(request.url).searchParams.get("kind");

  return isCertificateKind(kindParam) ? kindParam : "certificate";
}

export async function GET(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const template = await getCertificateTemplate(resolveKind(request));

  return jsonFromCertificateResult({ success: true, data: template });
}

export async function PUT(request: Request): Promise<Response> {
  const denied = await adminGuardResponse(request);

  if (denied) {
    return denied;
  }

  const bodyResult = await parseCertificateJsonBody(request);

  if (!bodyResult.success) {
    return jsonFromCertificateResult(bodyResult);
  }

  const body = bodyResult.data;

  const result = await updateCertificateTemplate(resolveKind(request), {
    format: isCertificateFormat(body.format) ? body.format : undefined,
    instructorName:
      typeof body.instructorName === "string" ? body.instructorName : undefined,
    instructorTitle:
      typeof body.instructorTitle === "string" ? body.instructorTitle : undefined,
    placeholders: Array.isArray(body.placeholders)
      ? parsePlaceholderFields(body.placeholders)
      : undefined,
    textFields: Array.isArray(body.textFields)
      ? parseFreeTextFields(body.textFields)
      : undefined,
    qrConfig:
      typeof body.qrConfig === "object" && body.qrConfig !== null
        ? parseQrConfig(body.qrConfig)
        : undefined,
  });

  return jsonFromCertificateResult(result);
}
