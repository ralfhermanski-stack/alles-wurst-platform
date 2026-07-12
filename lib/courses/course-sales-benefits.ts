/**
 * @file course-sales-benefits.ts
 * @purpose Verkaufs-Nutzenpunkte für die Kursdetailseite.
 */

import type { CourseCertificateType, CourseType } from "@prisma/client";

import type { CourseDetail } from "./course-types";

const DEFAULT_BENEFITS = [
  "Schritt-für-Schritt erklärt",
  "Zuhause umsetzbar",
  "Sofort starten",
] as const;

/** Anzeigetext für den Abschlussnachweis in Kaufbox und Verkaufsseite. */
export function formatCourseProofLabel(
  certificateType: CourseCertificateType,
  courseType: CourseType,
): string | null {
  if (certificateType === "participation") {
    return "Teilnahmeurkunde";
  }

  if (
    certificateType === "achievement" ||
    certificateType === "masterclass" ||
    courseType === "zertifikatskurs"
  ) {
    return "Zertifikat";
  }

  return null;
}

export function hasCourseProof(
  certificateType: CourseCertificateType,
  courseType: CourseType,
): boolean {
  return formatCourseProofLabel(certificateType, courseType) !== null;
}

/**
 * Erzeugt Nutzenpunkte für den Hero-Bereich aus Kursdaten.
 * Fehlende Informationen werden mit sinnvollen Standardwerten ergänzt.
 */
export function buildCourseSalesBenefits(course: CourseDetail): string[] {
  const benefits: string[] = [];

  if (!course.prerequisites?.trim()) {
    benefits.push("Keine Vorkenntnisse erforderlich");
  }

  if (course.moduleCount > 0 && course.lessonCount > 0) {
    benefits.push("Schritt-für-Schritt erklärt");
  } else if (!benefits.includes("Schritt-für-Schritt erklärt")) {
    benefits.push(DEFAULT_BENEFITS[0]);
  }

  if (course.requiredEquipment?.trim()) {
    benefits.push("Mit klarer Materialliste für zuhause");
  } else {
    benefits.push("Zuhause umsetzbar");
  }

  if (course.status === "published") {
    benefits.push("Sofort starten");
  }

  const proof = formatCourseProofLabel(course.certificateType, course.courseType);

  if (proof) {
    benefits.push(`${proof} inklusive`);
  }

  return benefits;
}
