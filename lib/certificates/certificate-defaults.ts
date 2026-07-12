/**
 * @file certificate-defaults.ts
 * @purpose Standardlayouts, Nachweistyp-Mapping und Vorgabetexte für Urkunden.
 */

import type { CourseCertificateType } from "@prisma/client";

import {
  CERTIFICATE_PLACEHOLDER_KEYS,
  type CertificateFormat,
  type CertificateFreeTextField,
  type CertificateKind,
  type CertificatePlaceholderField,
  type CertificatePlaceholderKey,
  type CertificateQrConfig,
} from "./certificate-types";

/** Standard-Rechtshinweis, den Ralf frei bearbeiten und löschen kann. */
export const DEFAULT_LEGAL_TEXT =
  "Diese Teilnahmeurkunde / dieses Zertifikat berechtigt nicht zum Führen eines Berufs-, Meister- oder sonstigen geschützten Titels im Sinne des Fleischerhandwerks.";

/**
 * Bildet den Kurs-Abschlussnachweis auf einen Vorlagentyp ab.
 * none → kein Nachweis, participation → Teilnahmeurkunde, sonst → Zertifikat.
 */
export function certificateKindFromCourseType(
  type: CourseCertificateType,
): CertificateKind | null {
  if (type === "none") {
    return null;
  }

  if (type === "participation") {
    return "participation";
  }

  return "certificate";
}

export function certificateKindLabel(kind: CertificateKind): string {
  return kind === "participation" ? "Teilnahmeurkunde" : "Zertifikat";
}

export function defaultFormatForKind(kind: CertificateKind): CertificateFormat {
  return kind === "participation" ? "portrait" : "landscape";
}

export function defaultQrConfig(format: CertificateFormat): CertificateQrConfig {
  return format === "portrait"
    ? { x: 42, y: 80, size: 16 }
    : { x: 82, y: 72, size: 12 };
}

const PROOF_TITLE_BY_KIND: Record<CertificateKind, string> = {
  certificate: "Zertifikat",
  participation: "Teilnahmeurkunde",
};

export function proofTitleText(kind: CertificateKind): string {
  return PROOF_TITLE_BY_KIND[kind];
}

/** Beispiel-Nummer für die Admin-Vorschau je Nachweistyp. */
export function previewNumberForKind(kind: CertificateKind): string {
  const year = new Date().getFullYear();
  const prefix = kind === "participation" ? "AW-U" : "AW-Z";

  return `${prefix}-${year}-000001`;
}

type PlaceholderLayout = Omit<CertificatePlaceholderField, "key">;

const LANDSCAPE_LAYOUT: Record<CertificatePlaceholderKey, PlaceholderLayout> = {
  PROOF_TYPE_TEXT: layout(10, 14, 80, 12, 34, 700, "center"),
  STUDENT_NAME: layout(10, 40, 80, 9, 26, 700, "center"),
  COURSE_TITLE: layout(10, 52, 80, 8, 18, 500, "center"),
  ISSUED_DATE: layout(12, 84, 35, 6, 12, 400, "left"),
  INSTRUCTOR_NAME: layout(55, 82, 33, 6, 14, 600, "center"),
  INSTRUCTOR_TITLE: layout(55, 87, 33, 5, 10, 400, "center"),
  CERTIFICATE_NUMBER: layout(12, 90, 35, 5, 10, 400, "left"),
  VERIFICATION_QR: layout(82, 72, 12, 12, 10, 400, "center"),
  VERIFICATION_URL: hidden(10, 96, 60, 4, 8, 400, "left"),
};

const PORTRAIT_LAYOUT: Record<CertificatePlaceholderKey, PlaceholderLayout> = {
  PROOF_TYPE_TEXT: layout(8, 16, 84, 8, 30, 700, "center"),
  STUDENT_NAME: layout(8, 40, 84, 8, 24, 700, "center"),
  COURSE_TITLE: layout(8, 50, 84, 7, 16, 500, "center"),
  ISSUED_DATE: layout(10, 66, 40, 5, 12, 400, "left"),
  INSTRUCTOR_NAME: layout(52, 88, 40, 5, 13, 600, "center"),
  INSTRUCTOR_TITLE: layout(52, 92, 40, 4, 9, 400, "center"),
  CERTIFICATE_NUMBER: layout(10, 92, 40, 4, 9, 400, "left"),
  VERIFICATION_QR: layout(42, 80, 16, 16, 10, 400, "center"),
  VERIFICATION_URL: hidden(8, 96, 84, 3, 7, 400, "center"),
};

function layout(
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
  fontWeight: number,
  textAlign: CertificatePlaceholderField["textAlign"],
): PlaceholderLayout {
  return {
    x,
    y,
    width,
    height,
    fontSize,
    fontWeight,
    textAlign,
    fontFamily: "Georgia, 'Times New Roman', serif",
    color: "#1a1a1a",
    visible: true,
  };
}

function hidden(
  x: number,
  y: number,
  width: number,
  height: number,
  fontSize: number,
  fontWeight: number,
  textAlign: CertificatePlaceholderField["textAlign"],
): PlaceholderLayout {
  return { ...layout(x, y, width, height, fontSize, fontWeight, textAlign), visible: false };
}

export function buildDefaultPlaceholders(
  format: CertificateFormat,
): CertificatePlaceholderField[] {
  const source = format === "portrait" ? PORTRAIT_LAYOUT : LANDSCAPE_LAYOUT;

  return CERTIFICATE_PLACEHOLDER_KEYS.map((key) => ({
    key,
    ...source[key],
  }));
}

/**
 * Ergänzt fehlende Platzhalter (z. B. neu eingeführte Schlüssel) mit Standardwerten,
 * ohne bestehende Positionen zu überschreiben.
 */
export function mergePlaceholderDefaults(
  existing: CertificatePlaceholderField[],
  format: CertificateFormat,
): CertificatePlaceholderField[] {
  const defaults = buildDefaultPlaceholders(format);
  const byKey = new Map(existing.map((field) => [field.key, field] as const));

  return defaults.map((fallback) => byKey.get(fallback.key) ?? fallback);
}

export function buildDefaultTextFields(): CertificateFreeTextField[] {
  return [
    {
      id: "legal-default",
      text: DEFAULT_LEGAL_TEXT,
      x: 10,
      y: 94,
      width: 80,
      height: 5,
      fontSize: 8,
      fontFamily: "Arial, sans-serif",
      color: "#555555",
      textAlign: "center",
      rotation: 0,
      bold: false,
      italic: true,
      visible: true,
    },
  ];
}
