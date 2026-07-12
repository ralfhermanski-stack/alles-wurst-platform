/**
 * @file course-catalog-service.ts
 * @purpose Öffentlicher Kurskatalog und Nutzer-Kursliste.
 */

import type { BillingPeriod } from "@prisma/client";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import {
  resolveActiveCourseAccess,
  type ActiveCourseAccess,
} from "./course-access-service";
import { getCourseProgress, getUserCertificateStatus } from "./course-progress-service";
import {
  normalizeCourseSlugParam,
  slugifyCourseTitle,
  toCourseDetail,
  toCourseSummary,
  type CourseDetail,
  type CourseSummary,
  type UserCourseEntry,
} from "./course-types";

const COURSE_INCLUDE = {
  modules: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      lessons: { orderBy: { sortOrder: "asc" as const } },
    },
  },
  courseGroup: { select: { id: true, name: true, slug: true } },
  courseSubgroup: {
    select: { id: true, name: true, slug: true, courseGroupId: true },
  },
};

/**
 * Listet veröffentlichte Kurse (Akademie-Katalog).
 */
export async function listPublishedCourses(filters?: {
  groupSlug?: string;
  subgroupSlug?: string;
}): Promise<CourseSummary[]> {
  const where: Prisma.CourseWhereInput = {
    status: "published",
  };

  if (filters?.groupSlug) {
    where.courseGroup = {
      slug: filters.groupSlug,
      isActive: true,
    };
  }

  if (filters?.subgroupSlug) {
    where.courseSubgroup = {
      slug: filters.subgroupSlug,
      isActive: true,
    };
  }

  const courses = await prisma.course.findMany({
    where,
    include: COURSE_INCLUDE,
    orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
  });

  return courses.map(toCourseSummary);
}

/**
 * Bereich 1 der Startseite: manuell hervorgehobene Kurse.
 * Nur veröffentlichte Kurse mit featuredOnHomepage = true,
 * sortiert nach homepageSortOrder (ASC), dann Titel.
 */
export async function listFeaturedHomepageCourses(): Promise<CourseSummary[]> {
  const courses = await prisma.course.findMany({
    where: { status: "published", featuredOnHomepage: true },
    include: COURSE_INCLUDE,
    orderBy: [{ homepageSortOrder: "asc" }, { title: "asc" }],
  });

  return courses.map(toCourseSummary);
}

/**
 * Bereich 2 der Startseite: die neuesten veröffentlichten Kurse.
 * Sortiert nach createdAt (DESC); bereits hervorgehobene Kurse werden
 * über excludeIds ausgeschlossen, um Dopplungen zu vermeiden.
 */
export async function listLatestCourses(
  limit: number,
  excludeIds: string[] = [],
): Promise<CourseSummary[]> {
  const courses = await prisma.course.findMany({
    where: {
      status: "published",
      ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
    },
    include: COURSE_INCLUDE,
    orderBy: [{ createdAt: "desc" }],
    take: limit,
  });

  return courses.map(toCourseSummary);
}

/**
 * Lädt einen Kurs per Slug (öffentlich oder mit Zugriff).
 */
export async function getCourseBySlug(
  slug: string,
): Promise<UserServiceResult<CourseDetail | null>> {
  try {
    const course = await prisma.course.findUnique({
      where: { slug },
      include: COURSE_INCLUDE,
    });

    if (!course || course.status === "archived") {
      return userSuccess(null);
    }

    if (course.status !== "published") {
      return userSuccess(null);
    }

    return userSuccess(toCourseDetail(course));
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Kurs konnte nicht geladen werden.",
    });
  }
}

/**
 * Lädt einen Kurs für die öffentliche Verkaufsseite.
 * Standard: nur veröffentlichte Kurse. Admins (allowUnpublished) dürfen
 * auch Entwürfe zur Vorschau sehen — jedoch niemals archivierte Kurse.
 */
export async function getCourseForSales(
  slug: string,
  options: { allowUnpublished?: boolean } = {},
): Promise<CourseDetail | null> {
  const decoded = normalizeCourseSlugParam(slug);
  const candidates = [decoded, slugifyCourseTitle(decoded)].filter(
    (value, index, list) => value && list.indexOf(value) === index,
  );

  let course = null;

  for (const candidate of candidates) {
    course = await prisma.course.findUnique({
      where: { slug: candidate },
      include: COURSE_INCLUDE,
    });

    if (course) {
      break;
    }
  }

  if (!course || course.status === "archived") {
    return null;
  }

  if (course.status !== "published" && !options.allowUnpublished) {
    return null;
  }

  return toCourseDetail(course);
}

export type CourseCheckoutTarget = {
  productSlug: string;
  productName: string;
  grossAmount: number;
  currency: string;
  billingPeriod: BillingPeriod;
};

/**
 * Ermittelt das Checkout-Ziel eines Kurses über die Produktverknüpfung.
 * Gibt nur dann ein Ziel zurück, wenn ein aktives Produkt mit aktivem Preis
 * existiert — sonst null (dann darf kein „Jetzt kaufen“-Button verlinken).
 */
export async function getCourseCheckoutTarget(
  productId: string | null,
): Promise<CourseCheckoutTarget | null> {
  if (!productId) {
    return null;
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, active: true },
    include: {
      prices: { where: { active: true }, orderBy: { grossAmount: "asc" } },
    },
  });

  if (!product || product.prices.length === 0) {
    return null;
  }

  const price = product.prices[0];

  return {
    productSlug: product.slug,
    productName: product.name,
    grossAmount: price.grossAmount.toNumber(),
    currency: price.currency,
    billingPeriod: price.billingPeriod,
  };
}

/**
 * Listet Kurse eines Nutzers mit Fortschritt.
 */
export async function listUserCourses(
  userId: string,
): Promise<UserServiceResult<UserCourseEntry[]>> {
  try {
    const published = await prisma.course.findMany({
      where: { status: "published" },
      include: COURSE_INCLUDE,
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    });

    const entries: UserCourseEntry[] = [];

    for (const course of published) {
      const access: ActiveCourseAccess | null = await resolveActiveCourseAccess(
        userId,
        course.id,
      );

      if (!access) {
        continue;
      }

      const progress = await getCourseProgress(userId, course.id);
      const certificateStatus = await getUserCertificateStatus(
        userId,
        course.id,
      );

      entries.push({
        course: toCourseSummary(course),
        hasAccess: true,
        accessSource: access.source,
        expiresAt: access.expiresAt,
        progress,
        certificateStatus,
      });
    }

    return userSuccess(entries);
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Kurse konnten nicht geladen werden.",
    });
  }
}
