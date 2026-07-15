/**
 * @file course-validation.ts
 * @purpose Validierungsregeln für Kursstruktur und Veröffentlichung.
 */

import type {
  CourseCertificateType,
  CourseLessonType,
  CourseType,
} from "@prisma/client";

import { hasValidVimeoInput } from "./vimeo-embed";

export type CourseValidationIssue = {
  path: string;
  message: string;
};

export type CourseValidationLesson = {
  id?: string;
  title: string;
  lessonType: CourseLessonType;
  vimeoVideoId?: string | null;
};

export type CourseValidationModule = {
  id?: string;
  title: string;
  lessons: CourseValidationLesson[];
};

export type CourseValidationInput = {
  courseType: CourseType;
  title?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  priceCents?: number | null;
  productId?: string | null;
  hasCheckoutLink?: boolean;
  certificateType?: CourseCertificateType;
  certificateOverride?: boolean;
  hasCertificateTemplate?: boolean;
  courseGroupId?: string | null;
  courseSubgroupId?: string | null;
  groupIsActive?: boolean | null;
  subgroupIsActive?: boolean | null;
  learningPathAssignments?: Array<{
    groupName?: string | null;
    subgroupName?: string | null;
    groupIsActive: boolean;
    subgroupIsActive?: boolean | null;
  }>;
  modules: CourseValidationModule[];
};

/** Ein "echtes" Zertifikat (nicht bloß Teilnahmeurkunde). */
function isFullCertificate(type?: CourseCertificateType): boolean {
  return type === "achievement" || type === "masterclass";
}

/**
 * Prüft, ob ein Kurs veröffentlicht werden kann.
 */
export function validateCourseForPublish(
  input: CourseValidationInput,
): CourseValidationIssue[] {
  const issues: CourseValidationIssue[] = [];

  if (!input.title?.trim()) {
    issues.push({
      path: "course.title",
      message: "Der Kurs braucht einen Titel.",
    });
  }

  if (!input.description?.trim()) {
    issues.push({
      path: "course.description",
      message: "Der Kurs braucht eine Beschreibung.",
    });
  }

  if (!input.shortDescription?.trim()) {
    issues.push({
      path: "course.shortDescription",
      message: "Der Kurs braucht eine Kurzbeschreibung.",
    });
  }

  if (input.priceCents === null || input.priceCents === undefined) {
    issues.push({
      path: "course.priceCents",
      message:
        "Es muss ein Preis gesetzt sein (0 € ist erlaubt, muss aber bewusst gewählt sein).",
    });
  } else if (input.priceCents < 0) {
    issues.push({
      path: "course.priceCents",
      message: "Der Preis darf nicht negativ sein.",
    });
  } else if (input.priceCents > 0 && !input.hasCheckoutLink) {
    issues.push({
      path: "course.productId",
      message:
        "Kostenpflichtige Kurse brauchen eine Produkt-/Checkout-Verknüpfung im Admin.",
    });
  }

  if (input.modules.length < 1) {
    issues.push({
      path: "course.modules",
      message: "Der Kurs braucht mindestens ein Modul.",
    });
    return issues;
  }

  input.modules.forEach((courseModule, moduleIndex) => {
    const modulePath = `modules[${moduleIndex}]`;

    if (courseModule.lessons.length < 1) {
      issues.push({
        path: `${modulePath}.lessons`,
        message: `Modul „${courseModule.title}" braucht mindestens eine Lektion.`,
      });
    }

    courseModule.lessons.forEach((lesson, lessonIndex) => {
      const lessonPath = `${modulePath}.lessons[${lessonIndex}]`;

      if (lesson.lessonType === "video" && !hasValidVimeoInput(lesson.vimeoVideoId)) {
        issues.push({
          path: `${lessonPath}.vimeoVideoId`,
          message: `Video-Lektion „${lesson.title}" braucht eine Vimeo-ID oder Embed-URL.`,
        });
      }
    });
  });

  const certificateType = input.certificateType ?? "none";
  const proofChosen = certificateType !== "none";

  // Echtes Zertifikat braucht eine Zertifikat-Lektion (unabhängig vom Kurstyp).
  if (isFullCertificate(certificateType)) {
    const hasCertificateLesson = input.modules.some((courseModule) =>
      courseModule.lessons.some((lesson) => lesson.lessonType === "certificate"),
    );

    if (!hasCertificateLesson) {
      issues.push({
        path: "course.lessons",
        message:
          "Kurse mit Zertifikat brauchen mindestens eine Zertifikat-Lektion.",
      });
    }
  }

  // Minikurs darf nur mit bewusstem Admin-Override ein Zertifikat ausstellen.
  if (
    input.courseType === "minikurs" &&
    isFullCertificate(certificateType) &&
    !input.certificateOverride
  ) {
    issues.push({
      path: "course.certificateType",
      message:
        "Minikurse dürfen kein vollwertiges Zertifikat ausstellen. Wähle eine Teilnahmeurkunde oder aktiviere den Admin-Override bewusst.",
    });
  }

  // Bei gewähltem Abschlussnachweis muss eine passende aktive Vorlage vorhanden sein.
  if (proofChosen && input.hasCertificateTemplate === false) {
    issues.push({
      path: "course.certificateTemplate",
      message: isFullCertificate(certificateType)
        ? "Für Zertifikate muss im Urkunden-Admin eine Zertifikatsvorlage mit Hintergrund hinterlegt sein."
        : "Für Teilnahmeurkunden muss im Urkunden-Admin eine Urkundenvorlage mit Hintergrund hinterlegt sein.",
    });
  }

  if (input.learningPathAssignments && input.learningPathAssignments.length > 0) {
    for (const assignment of input.learningPathAssignments) {
      if (assignment.groupIsActive === false) {
        issues.push({
          path: "course.learningPathAssignments",
          message: `Der Lernpfad „${assignment.groupName ?? "Unbekannt"}" ist inaktiv.`,
        });
      }

      if (assignment.subgroupIsActive === false) {
        issues.push({
          path: "course.learningPathAssignments",
          message: `Das Modul „${assignment.subgroupName ?? "Unbekannt"}" ist inaktiv.`,
        });
      }
    }
  } else if (!input.courseGroupId) {
    issues.push({
      path: "course.courseGroupId",
      message: "Der Kurs braucht mindestens einen Lernpfad.",
    });
  } else if (input.groupIsActive === false) {
    issues.push({
      path: "course.courseGroupId",
      message: "Der primäre Lernpfad ist inaktiv.",
    });
  }

  if (
    input.courseSubgroupId &&
    (!input.learningPathAssignments || input.learningPathAssignments.length === 0)
  ) {
    if (input.subgroupIsActive === false) {
      issues.push({
        path: "course.courseSubgroupId",
        message: "Das gewählte Modul ist inaktiv.",
      });
    }
  }

  return issues;
}

export function formatValidationIssues(issues: CourseValidationIssue[]): string {
  return issues.map((issue) => issue.message).join(" ");
}
