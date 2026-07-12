/**
 * @file course-labels.ts
 * @purpose Deutsche Labels für Kursplattform.
 */

import type {
  CourseCertificateType,
  CourseLessonType,
  CourseStatus,
  CourseType,
  UserCertificateStatus,
} from "@prisma/client";

export const COURSE_TYPE_LABELS: Record<CourseType, string> = {
  minikurs: "Minikurs",
  zertifikatskurs: "Zertifikatskurs",
};

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  draft: "Entwurf",
  published: "Veröffentlicht",
  archived: "Archiviert",
};

export const COURSE_LESSON_TYPE_LABELS: Record<CourseLessonType, string> = {
  video: "Video",
  text: "Text",
  download: "Download",
  recipe: "Rezept",
  certificate: "Zertifikat",
};

export const COURSE_CERTIFICATE_TYPE_LABELS: Record<CourseCertificateType, string> = {
  none: "Kein Zertifikat",
  participation: "Teilnahme",
  achievement: "Leistung",
  masterclass: "Masterclass",
};

export const USER_CERTIFICATE_STATUS_LABELS: Record<UserCertificateStatus, string> = {
  locked: "Gesperrt",
  available: "Verfügbar",
  issued: "Ausgestellt",
  revoked: "Widerrufen",
};

/**
 * Formatiert einen Kurspreis (in Cent) für die Anzeige.
 * - null  → null (Preis nicht gesetzt, nicht anzeigen)
 * - 0     → "Kostenlos"
 * - sonst → z. B. "149,00 €"
 */
export function formatCoursePrice(
  priceCents: number | null | undefined,
  currency = "EUR",
): string | null {
  if (priceCents === null || priceCents === undefined) {
    return null;
  }

  if (priceCents === 0) {
    return "Kostenlos";
  }

  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency,
    }).format(priceCents / 100);
  } catch {
    return `${(priceCents / 100).toFixed(2)} ${currency}`;
  }
}
