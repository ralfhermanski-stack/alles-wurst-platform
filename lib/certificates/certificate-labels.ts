/**
 * @file certificate-labels.ts
 * @purpose Deutsche Labels für Zertifikate.
 */

import type { UserCertificateStatus } from "@prisma/client";

import type { CertificatePlaceholderKey } from "./certificate-types";

export const USER_CERTIFICATE_STATUS_LABELS: Record<UserCertificateStatus, string> = {
  locked: "Gesperrt",
  available: "Verfügbar",
  issued: "Ausgestellt",
  revoked: "Widerrufen",
};

export const CERTIFICATE_PLACEHOLDER_LABELS: Record<CertificatePlaceholderKey, string> = {
  PROOF_TYPE_TEXT: "Nachweistyp-Text",
  COURSE_TITLE: "Kurstitel",
  STUDENT_NAME: "Teilnehmername",
  CERTIFICATE_NUMBER: "Urkunden-/Zertifikatsnummer",
  ISSUED_DATE: "Abschlussdatum",
  INSTRUCTOR_NAME: "Dozent/Signatur",
  INSTRUCTOR_TITLE: "Dozententitel",
  VERIFICATION_QR: "QR-Code",
  VERIFICATION_URL: "Verifizierungs-URL",
};

export const VERIFICATION_STATUS_LABELS = {
  valid: "Gültig",
  invalid: "Ungültig",
  revoked: "Widerrufen",
} as const;
