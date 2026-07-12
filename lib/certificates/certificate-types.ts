/**
 * @file certificate-types.ts
 * @purpose Typen für das Zertifikat-PDF-System.
 */

import type { UserCertificateStatus } from "@prisma/client";

export const CERTIFICATE_PLACEHOLDER_KEYS = [
  "PROOF_TYPE_TEXT",
  "COURSE_TITLE",
  "STUDENT_NAME",
  "CERTIFICATE_NUMBER",
  "ISSUED_DATE",
  "INSTRUCTOR_NAME",
  "INSTRUCTOR_TITLE",
  "VERIFICATION_QR",
  "VERIFICATION_URL",
] as const;

export type CertificatePlaceholderKey =
  (typeof CERTIFICATE_PLACEHOLDER_KEYS)[number];

/** Nachweistyp: vollwertiges Zertifikat oder Teilnahmeurkunde. */
export type CertificateKind = "certificate" | "participation";

/** Seitenformat der Vorlage. */
export type CertificateFormat = "portrait" | "landscape";

export type CertificateTextAlign = "left" | "center" | "right";

export type CertificatePlaceholderField = {
  key: CertificatePlaceholderKey;
  x: number;
  y: number;
  width: number;
  height: number;
  textAlign: CertificateTextAlign;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  color: string;
  visible: boolean;
};

export type CertificateQrConfig = {
  x: number;
  y: number;
  size: number;
};

/** Frei editierbares Textelement (Rechtshinweis, Fußnote, Rand-Hinweis). */
export type CertificateFreeTextField = {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: string;
  color: string;
  textAlign: CertificateTextAlign;
  rotation: number;
  bold: boolean;
  italic: boolean;
  visible: boolean;
};

export type CertificateTemplateEntry = {
  id: string;
  kind: CertificateKind;
  format: CertificateFormat;
  backgroundFileName: string | null;
  hasBackground: boolean;
  instructorName: string;
  instructorTitle: string;
  placeholders: CertificatePlaceholderField[];
  textFields: CertificateFreeTextField[];
  qrConfig: CertificateQrConfig;
  updatedAt: string;
};

export type CertificatePlaceholderValues = Record<
  CertificatePlaceholderKey,
  string
>;

export type CertificatePrintData = {
  certificateId: string;
  certificateNumber: string;
  status: UserCertificateStatus;
  kind: CertificateKind;
  format: CertificateFormat;
  courseTitle: string;
  studentName: string;
  issuedDate: string;
  instructorName: string;
  instructorTitle: string;
  verificationUrl: string;
  verificationQrDataUrl: string;
  backgroundUrl: string | null;
  placeholders: CertificatePlaceholderField[];
  textFields: CertificateFreeTextField[];
  qrConfig: CertificateQrConfig;
  values: CertificatePlaceholderValues;
};

export type CertificateSummary = {
  id: string;
  certificateNumber: string | null;
  status: UserCertificateStatus;
  courseTitle: string;
  courseSlug: string;
  issuedAt: string | null;
  studentName: string;
  studentEmail: string;
};

export type CertificateVerificationResult = {
  valid: boolean;
  status: "valid" | "invalid" | "revoked";
  certificateNumber: string | null;
  studentName: string | null;
  courseTitle: string | null;
  issuedAt: string | null;
  message: string;
};

export function parsePlaceholderFields(value: unknown): CertificatePlaceholderField[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map((item) => ({
      key: String(item.key ?? "") as CertificatePlaceholderKey,
      x: Number(item.x ?? 0),
      y: Number(item.y ?? 0),
      width: Number(item.width ?? 20),
      height: Number(item.height ?? 5),
      textAlign: (item.textAlign === "left" || item.textAlign === "right"
        ? item.textAlign
        : "center") as CertificateTextAlign,
      fontSize: Number(item.fontSize ?? 14),
      fontWeight: Number(item.fontWeight ?? 400),
      fontFamily: String(item.fontFamily ?? "Arial, sans-serif"),
      color: String(item.color ?? "#1a1a1a"),
      visible: item.visible !== false,
    }))
    .filter((field) =>
      CERTIFICATE_PLACEHOLDER_KEYS.includes(field.key),
    );
}

export function parseQrConfig(value: unknown): CertificateQrConfig {
  if (typeof value !== "object" || value === null) {
    return { x: 82, y: 72, size: 12 };
  }

  const config = value as Record<string, unknown>;

  return {
    x: Number(config.x ?? 82),
    y: Number(config.y ?? 72),
    size: Number(config.size ?? 12),
  };
}

function normalizeAlign(value: unknown): CertificateTextAlign {
  return value === "left" || value === "right" ? value : "center";
}

export function parseFreeTextFields(value: unknown): CertificateFreeTextField[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .map((item, index) => ({
      id:
        typeof item.id === "string" && item.id.trim()
          ? item.id
          : `text-${index}-${Math.random().toString(36).slice(2, 8)}`,
      text: String(item.text ?? ""),
      x: Number(item.x ?? 10),
      y: Number(item.y ?? 90),
      width: Number(item.width ?? 60),
      height: Number(item.height ?? 6),
      fontSize: Number(item.fontSize ?? 9),
      fontFamily: String(item.fontFamily ?? "Arial, sans-serif"),
      color: String(item.color ?? "#444444"),
      textAlign: normalizeAlign(item.textAlign),
      rotation: Number(item.rotation ?? 0),
      bold: item.bold === true,
      italic: item.italic === true,
      visible: item.visible !== false,
    }));
}

export function isCertificateFormat(value: unknown): value is CertificateFormat {
  return value === "portrait" || value === "landscape";
}

export function isCertificateKind(value: unknown): value is CertificateKind {
  return value === "certificate" || value === "participation";
}
