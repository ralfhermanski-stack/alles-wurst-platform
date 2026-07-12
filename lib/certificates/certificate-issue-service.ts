/**
 * @file certificate-issue-service.ts
 * @purpose Zertifikat ausstellen und Druckdaten laden.
 */

import { randomBytes } from "node:crypto";

import type { UserCertificateStatus } from "@prisma/client";

import { getCourseProgress } from "@/lib/courses/course-progress-service";
import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import { buildVerificationUrl } from "./certificate-config";
import {
  certificateKindFromCourseType,
  proofTitleText,
} from "./certificate-defaults";
import { allocateCertificateNumber } from "./certificate-number";
import {
  buildPlaceholderValues,
  buildStudentDisplayName,
  formatCertificateDate,
  generateVerificationQrDataUrl,
} from "./certificate-render";
import { getCertificateTemplate } from "./certificate-template-service";
import type {
  CertificateKind,
  CertificatePrintData,
  CertificateSummary,
} from "./certificate-types";

function createVerificationToken(): string {
  return randomBytes(32).toString("hex");
}

async function validateCertificateIssueEligibility(
  userId: string,
  courseId: string,
): Promise<UserServiceResult<{ kind: CertificateKind }>> {
  const course = await prisma.course.findUnique({ where: { id: courseId } });

  if (!course) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Kurs wurde nicht gefunden.",
    });
  }

  const kind = certificateKindFromCourseType(course.certificateType);

  if (!kind) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Für diesen Kurs ist kein Abschlussnachweis vorgesehen.",
    });
  }

  const progress = await getCourseProgress(userId, courseId);

  if (!progress.courseCompleted) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Der Kurs ist noch nicht abgeschlossen.",
    });
  }

  return userSuccess({ kind });
}

/**
 * Stellt ein Zertifikat beim ersten Abruf aus (status available → issued).
 */
export async function issueCertificateOnFirstAccess(
  certificateId: string,
  userId: string,
): Promise<UserServiceResult<CertificatePrintData>> {
  try {
    const certificate = await prisma.userCourseCertificate.findUnique({
      where: { id: certificateId },
      include: {
        course: true,
        user: { include: { profile: true } },
      },
    });

    if (!certificate || certificate.userId !== userId) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Zertifikat wurde nicht gefunden.",
      });
    }

    if (certificate.status === "revoked") {
      return userFailure({
        code: "FORBIDDEN",
        message: "Dieses Zertifikat wurde widerrufen.",
      });
    }

    if (certificate.status === "locked") {
      return userFailure({
        code: "VALIDATION_ERROR",
        message: "Das Zertifikat ist noch nicht freigeschaltet.",
      });
    }

    const eligibility = await validateCertificateIssueEligibility(
      userId,
      certificate.courseId,
    );

    if (!eligibility.success) {
      return eligibility;
    }

    const kind = eligibility.data.kind;

    let issued = certificate;

    if (certificate.status === "available") {
      const now = new Date();
      const token = createVerificationToken();

      issued = await prisma.$transaction(async (tx) => {
        const certificateNumber = await allocateCertificateNumber(tx, kind);
        const verificationUrl = buildVerificationUrl(certificateNumber, token);

        return tx.userCourseCertificate.update({
          where: { id: certificate.id },
          data: {
            status: "issued",
            certificateNumber,
            issuedAt: now,
            verificationToken: token,
            verificationUrl,
            pdfGeneratedAt: now,
          },
          include: {
            course: true,
            user: { include: { profile: true } },
          },
        });
      });
    }

    if (!issued.certificateNumber || !issued.issuedAt || !issued.verificationUrl) {
      return userFailure({
        code: "INTERNAL_ERROR",
        message: "Zertifikatsdaten sind unvollständig.",
      });
    }

    const template = await getCertificateTemplate(kind);
    const profile = issued.user.profile;
    const proofTypeText = proofTitleText(kind);

    const studentName = profile
      ? buildStudentDisplayName({
          firstName: profile.firstName,
          lastName: profile.lastName,
          company: profile.company,
        })
      : issued.user.email;

    const verificationQrDataUrl = await generateVerificationQrDataUrl(
      issued.verificationUrl,
    );

    const values = buildPlaceholderValues({
      proofTypeText,
      courseTitle: issued.course.title,
      studentName,
      certificateNumber: issued.certificateNumber,
      issuedDate: formatCertificateDate(issued.issuedAt),
      instructorName: template.instructorName,
      instructorTitle: template.instructorTitle,
      verificationUrl: issued.verificationUrl,
    });

    return userSuccess({
      certificateId: issued.id,
      certificateNumber: issued.certificateNumber,
      status: issued.status,
      kind,
      format: template.format,
      courseTitle: issued.course.title,
      studentName,
      issuedDate: formatCertificateDate(issued.issuedAt),
      instructorName: template.instructorName,
      instructorTitle: template.instructorTitle,
      verificationUrl: issued.verificationUrl,
      verificationQrDataUrl,
      backgroundUrl: template.hasBackground
        ? `/api/certificates/template/background?kind=${kind}`
        : null,
      placeholders: template.placeholders,
      textFields: template.textFields,
      qrConfig: template.qrConfig,
      values,
    });
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Zertifikat konnte nicht ausgestellt werden.",
    });
  }
}

/**
 * Lädt Druckdaten für ein ausgestelltes Zertifikat (ohne erneute Ausstellung).
 */
export async function getIssuedCertificatePrintData(
  certificateId: string,
  userId: string,
): Promise<UserServiceResult<CertificatePrintData>> {
  const certificate = await prisma.userCourseCertificate.findUnique({
    where: { id: certificateId },
  });

  if (!certificate || certificate.userId !== userId) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Zertifikat wurde nicht gefunden.",
    });
  }

  if (certificate.status === "available") {
    return issueCertificateOnFirstAccess(certificateId, userId);
  }

  if (certificate.status !== "issued") {
    return userFailure({
      code: "FORBIDDEN",
      message: "Zertifikat ist nicht verfügbar.",
    });
  }

  return issueCertificateOnFirstAccess(certificateId, userId);
}

export async function listUserCertificates(
  userId: string,
): Promise<CertificateSummary[]> {
  const rows = await prisma.userCourseCertificate.findMany({
    where: {
      userId,
      status: { in: ["available", "issued"] },
      certificateType: { not: "none" },
    },
    include: {
      course: { select: { title: true, slug: true } },
      user: { include: { profile: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return rows.map((row) => {
    const profile = row.user.profile;
    const studentName = profile
      ? buildStudentDisplayName({
          firstName: profile.firstName,
          lastName: profile.lastName,
          company: profile.company,
        })
      : row.user.email;

    return {
      id: row.id,
      certificateNumber: row.certificateNumber,
      status: row.status,
      courseTitle: row.course.title,
      courseSlug: row.course.slug,
      issuedAt: row.issuedAt?.toISOString() ?? null,
      studentName,
      studentEmail: row.user.email,
    };
  });
}

export async function listAllCertificatesForAdmin(): Promise<
  CertificateSummary[]
> {
  const rows = await prisma.userCourseCertificate.findMany({
    where: {
      certificateType: { not: "none" },
      status: { in: ["available", "issued", "revoked"] },
    },
    include: {
      course: { select: { title: true, slug: true } },
      user: { include: { profile: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return rows.map((row) => {
    const profile = row.user.profile;
    const studentName = profile
      ? buildStudentDisplayName({
          firstName: profile.firstName,
          lastName: profile.lastName,
          company: profile.company,
        })
      : row.user.email;

    return {
      id: row.id,
      certificateNumber: row.certificateNumber,
      status: row.status,
      courseTitle: row.course.title,
      courseSlug: row.course.slug,
      issuedAt: row.issuedAt?.toISOString() ?? null,
      studentName,
      studentEmail: row.user.email,
    };
  });
}

export async function revokeCertificate(
  certificateId: string,
): Promise<UserServiceResult<UserCertificateStatus>> {
  try {
    const updated = await prisma.userCourseCertificate.update({
      where: { id: certificateId },
      data: { status: "revoked" },
    });

    return userSuccess(updated.status);
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Zertifikat konnte nicht widerrufen werden.",
    });
  }
}

export async function reissueCertificate(
  certificateId: string,
): Promise<UserServiceResult<true>> {
  try {
    await prisma.userCourseCertificate.update({
      where: { id: certificateId },
      data: {
        status: "available",
        certificateNumber: null,
        issuedAt: null,
        verificationToken: null,
        verificationUrl: null,
        pdfGeneratedAt: null,
      },
    });

    return userSuccess(true);
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Zertifikat konnte nicht neu ausgestellt werden.",
    });
  }
}
