/**
 * @file certificate-verification-service.ts
 * @purpose Öffentliche Zertifikatsverifikation.
 */

import { prisma } from "@/lib/db/prisma";

import { buildStudentDisplayName, formatCertificateDate } from "./certificate-render";
import type { CertificateVerificationResult } from "./certificate-types";

export async function verifyCertificate(input: {
  certificateNumber: string;
  token?: string | null;
}): Promise<CertificateVerificationResult> {
  const certificate = await prisma.userCourseCertificate.findFirst({
    where: { certificateNumber: input.certificateNumber },
    include: {
      course: { select: { title: true } },
      user: { include: { profile: true } },
    },
  });

  if (!certificate) {
    return {
      valid: false,
      status: "invalid",
      certificateNumber: input.certificateNumber,
      studentName: null,
      courseTitle: null,
      issuedAt: null,
      message: "Zertifikatsnummer wurde nicht gefunden.",
    };
  }

  if (certificate.status === "revoked") {
    return {
      valid: false,
      status: "revoked",
      certificateNumber: certificate.certificateNumber,
      studentName: certificate.user.profile
        ? buildStudentDisplayName({
            firstName: certificate.user.profile.firstName,
            lastName: certificate.user.profile.lastName,
            company: certificate.user.profile.company,
          })
        : certificate.user.email,
      courseTitle: certificate.course.title,
      issuedAt: certificate.issuedAt
        ? formatCertificateDate(certificate.issuedAt)
        : null,
      message: "Dieses Zertifikat wurde widerrufen.",
    };
  }

  if (certificate.status !== "issued") {
    return {
      valid: false,
      status: "invalid",
      certificateNumber: certificate.certificateNumber,
      studentName: null,
      courseTitle: certificate.course.title,
      issuedAt: null,
      message: "Zertifikat ist nicht ausgestellt oder ungültig.",
    };
  }

  if (
    input.token &&
    certificate.verificationToken &&
    input.token !== certificate.verificationToken
  ) {
    return {
      valid: false,
      status: "invalid",
      certificateNumber: certificate.certificateNumber,
      studentName: null,
      courseTitle: certificate.course.title,
      issuedAt: certificate.issuedAt
        ? formatCertificateDate(certificate.issuedAt)
        : null,
      message: "Verifizierungstoken ist ungültig.",
    };
  }

  const studentName = certificate.user.profile
    ? buildStudentDisplayName({
        firstName: certificate.user.profile.firstName,
        lastName: certificate.user.profile.lastName,
        company: certificate.user.profile.company,
      })
    : certificate.user.email;

  return {
    valid: true,
    status: "valid",
    certificateNumber: certificate.certificateNumber,
    studentName,
    courseTitle: certificate.course.title,
    issuedAt: certificate.issuedAt
      ? formatCertificateDate(certificate.issuedAt)
      : null,
    message: "Zertifikat ist gültig.",
  };
}
