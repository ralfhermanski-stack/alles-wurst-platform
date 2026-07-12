/**
 * @file certificate-render.ts
 * @purpose Platzhalter-Werte und QR-Code für Zertifikatsdruck.
 */

import QRCode from "qrcode";

import type {
  CertificatePlaceholderKey,
  CertificatePlaceholderValues,
} from "./certificate-types";

export function formatCertificateDate(date: Date): string {
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function buildStudentDisplayName(input: {
  firstName: string;
  lastName: string;
  company?: string | null;
}): string {
  const name = `${input.firstName} ${input.lastName}`.trim();

  if (input.company?.trim()) {
    return `${name} (${input.company.trim()})`;
  }

  return name;
}

export async function generateVerificationQrDataUrl(
  verificationUrl: string,
): Promise<string> {
  return QRCode.toDataURL(verificationUrl, {
    margin: 1,
    width: 256,
    color: {
      dark: "#1a1a1a",
      light: "#ffffff00",
    },
  });
}

export function buildPlaceholderValues(input: {
  proofTypeText: string;
  courseTitle: string;
  studentName: string;
  certificateNumber: string;
  issuedDate: string;
  instructorName: string;
  instructorTitle: string;
  verificationUrl: string;
}): CertificatePlaceholderValues {
  const values = {} as CertificatePlaceholderValues;

  const entries: Array<[CertificatePlaceholderKey, string]> = [
    ["PROOF_TYPE_TEXT", input.proofTypeText],
    ["COURSE_TITLE", input.courseTitle],
    ["STUDENT_NAME", input.studentName],
    ["CERTIFICATE_NUMBER", input.certificateNumber],
    ["ISSUED_DATE", input.issuedDate],
    ["INSTRUCTOR_NAME", input.instructorName],
    ["INSTRUCTOR_TITLE", input.instructorTitle],
    ["VERIFICATION_URL", input.verificationUrl],
    ["VERIFICATION_QR", input.verificationUrl],
  ];

  for (const [key, value] of entries) {
    values[key] = value;
  }

  return values;
}
