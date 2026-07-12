/**
 * @file certificate-config.ts
 * @purpose Konfiguration für Zertifikats-URLs und Standardwerte.
 */

export function getCertificateAppBaseUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.CERTIFICATE_VERIFICATION_BASE_URL?.trim();

  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

export function buildVerificationPath(certificateNumber: string): string {
  return `/zertifikat/verifizieren/${encodeURIComponent(certificateNumber)}`;
}

export function buildVerificationUrl(
  certificateNumber: string,
  token: string,
): string {
  const base = getCertificateAppBaseUrl();
  const path = buildVerificationPath(certificateNumber);

  return `${base}${path}?token=${encodeURIComponent(token)}`;
}

export const CERTIFICATE_PREVIEW_TEST_DATA = {
  COURSE_TITLE: "Beispielkurs",
  STUDENT_NAME: "Max Mustermann",
  ISSUED_DATE: "07.07.2026",
  INSTRUCTOR_NAME: "Ralf Hermanski",
  INSTRUCTOR_TITLE: "Fleischermeister seit 1994",
  VERIFICATION_URL: "https://alles-wurst.de/zertifikat/verifizieren/AW-Z-2026-000001",
} as const;
