/**
 * @file course-sales-context.ts
 * @purpose Server-seitige Daten für die öffentliche Kurs-Verkaufsseite.
 */

import { getSessionUser } from "@/lib/auth/auth-service";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";
import { hasActiveCourseAccess } from "@/lib/courses/course-access-service";
import { getCertificateTemplate } from "@/lib/certificates/certificate-template-service";
import type { CertificateTemplateEntry } from "@/lib/certificates/certificate-types";
import type { CourseReviewSummary } from "@/lib/reviews/course-review-types";
import { getPublicCourseReviewSummary } from "@/lib/reviews/course-review-service";

import {
  getCourseCheckoutTarget,
  getCourseForSales,
  type CourseCheckoutTarget,
} from "./course-catalog-service";
import type { CourseDetail } from "./course-types";

export type CourseSalesContext = {
  course: CourseDetail;
  userId: string | null;
  isLoggedIn: boolean;
  isAdmin: boolean;
  hasAccess: boolean;
  checkoutTarget: CourseCheckoutTarget | null;
  instructor: {
    name: string;
    title: string;
  };
  reviewSummary: CourseReviewSummary;
};

function resolveInstructor(template: CertificateTemplateEntry): {
  name: string;
  title: string;
} {
  return {
    name: template.instructorName,
    title: template.instructorTitle,
  };
}

/**
 * Lädt alle Daten für die Verkaufsseite eines Kurses.
 * Gibt null zurück, wenn der Kurs nicht gefunden oder nicht sichtbar ist.
 */
export async function resolveCourseSalesContext(
  slug: string,
): Promise<CourseSalesContext | null> {
  const userId = await getSessionUserIdFromCookies();
  let isAdmin = false;

  if (userId) {
    const userResult = await getSessionUser(userId);

    if (userResult.success && userResult.data?.membership?.role === "admin") {
      isAdmin = true;
    }
  }

  const course = await getCourseForSales(slug, {
    allowUnpublished: isAdmin,
  });

  if (!course) {
    return null;
  }

  const [hasAccess, checkoutTarget, template, reviewSummary] = await Promise.all([
    userId ? hasActiveCourseAccess(userId, course.id) : Promise.resolve(false),
    getCourseCheckoutTarget(course.productId),
    getCertificateTemplate(),
    getPublicCourseReviewSummary(course.id),
  ]);

  const instructor = resolveInstructor(template);

  return {
    course,
    userId,
    isLoggedIn: Boolean(userId),
    isAdmin,
    hasAccess,
    checkoutTarget,
    instructor,
    reviewSummary,
  };
}
