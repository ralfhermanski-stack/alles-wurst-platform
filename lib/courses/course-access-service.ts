/**
 * @file course-access-service.ts
 * @purpose Kurszugriff: Kauf, Buchhaltung, Admin, Mitgliedschaft.
 */

import type {
  BillingPeriod,
  CourseAccessSource,
  CourseAccessStatus,
  MembershipRole,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

export type ActiveCourseAccess = {
  courseId: string;
  status: CourseAccessStatus;
  source: CourseAccessSource;
  grantedAt: string | null;
  expiresAt: string | null;
};

function isAccessCurrentlyValid(input: {
  status: CourseAccessStatus;
  expiresAt: Date | null;
}): boolean {
  if (input.status !== "active") {
    return false;
  }

  if (input.expiresAt && input.expiresAt.getTime() < Date.now()) {
    return false;
  }

  return true;
}

/**
 * Prüft, ob ein Nutzer aktiven Zugriff auf einen Kurs hat.
 */
export async function hasActiveCourseAccess(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const access = await resolveActiveCourseAccess(userId, courseId);
  return access !== null;
}

/**
 * Löst den aktiven Kurszugriff auf (UserCourseAccess + Membership-Bonus).
 */
export async function resolveActiveCourseAccess(
  userId: string,
  courseId: string,
): Promise<ActiveCourseAccess | null> {
  const direct = await prisma.userCourseAccess.findUnique({
    where: {
      userId_courseId: { userId, courseId },
    },
  });

  if (direct && isAccessCurrentlyValid(direct)) {
    return {
      courseId,
      status: direct.status,
      source: direct.source,
      grantedAt: direct.grantedAt?.toISOString() ?? null,
      expiresAt: direct.expiresAt?.toISOString() ?? null,
    };
  }

  const membership = await prisma.membership.findUnique({
    where: { userId },
  });

  if (
    !membership ||
    membership.status !== "active" ||
    membership.accessBlocked
  ) {
    return null;
  }

  const rules = await prisma.membershipCourseRule.findMany({
    where: {
      courseId,
      membershipRole: membership.role,
      active: true,
    },
  });

  if (rules.length === 0) {
    return null;
  }

  const membershipEnd =
    membership.extendedUntil ?? membership.endsAt ?? null;

  if (membershipEnd && membershipEnd.getTime() < Date.now()) {
    return null;
  }

  const hasMatchingRule = rules.some((rule) => {
    if (!rule.billingPeriod) {
      return true;
    }

    if (rule.billingPeriod === "yearly") {
      return Boolean(membership.extendedUntil ?? membership.endsAt);
    }

    return true;
  });

  if (!hasMatchingRule) {
    return null;
  }

  return {
    courseId,
    status: "active",
    source: "membership_bonus",
    grantedAt: membership.startedAt?.toISOString() ?? null,
    expiresAt: membershipEnd?.toISOString() ?? null,
  };
}

/**
 * Synchronisiert UserCourseAccess nach Produkt-Kauf (CourseAccess).
 */
export async function syncUserCourseAccessFromProduct(input: {
  userId: string;
  productId: string;
  courseAccessId: string;
  source: CourseAccessSource;
  status: CourseAccessStatus;
  grantedAt: Date | null;
  expiresAt: Date | null;
}): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    include: { course: true },
  });

  if (!product?.course) {
    return;
  }

  await prisma.userCourseAccess.upsert({
    where: {
      userId_courseId: {
        userId: input.userId,
        courseId: product.course.id,
      },
    },
    create: {
      userId: input.userId,
      courseId: product.course.id,
      status: input.status,
      source: input.source,
      grantedAt: input.grantedAt,
      expiresAt: input.expiresAt,
      courseAccessId: input.courseAccessId,
    },
    update: {
      status: input.status,
      source: input.source,
      grantedAt: input.grantedAt,
      expiresAt: input.expiresAt,
      revokedAt: null,
      courseAccessId: input.courseAccessId,
    },
  });
}

/**
 * Gewährt Bonuskurse nach Jahresmitgliedschaft.
 */
export async function grantMembershipBonusCourses(input: {
  userId: string;
  membershipRole: MembershipRole;
  billingPeriod: BillingPeriod;
  membershipEndsAt: Date | null;
}): Promise<void> {
  if (input.billingPeriod !== "yearly") {
    return;
  }

  const rules = await prisma.membershipCourseRule.findMany({
    where: {
      membershipRole: input.membershipRole,
      active: true,
      OR: [{ billingPeriod: null }, { billingPeriod: "yearly" }],
    },
  });

  const now = new Date();

  for (const rule of rules) {
    await prisma.userCourseAccess.upsert({
      where: {
        userId_courseId: {
          userId: input.userId,
          courseId: rule.courseId,
        },
      },
      create: {
        userId: input.userId,
        courseId: rule.courseId,
        status: "active",
        source: "membership_bonus",
        grantedAt: now,
        expiresAt: input.membershipEndsAt,
        note: rule.note,
      },
      update: {
        status: "active",
        source: "membership_bonus",
        grantedAt: now,
        expiresAt: input.membershipEndsAt,
        revokedAt: null,
        note: rule.note,
      },
    });
  }
}

export type GrantCourseAccessInput = {
  expiresAt?: string | null;
  note?: string | null;
};

/**
 * Admin/Buchhaltung: Kurszugriff manuell gewähren.
 */
export async function grantUserCourseAccess(
  actorUserId: string,
  userId: string,
  courseId: string,
  input: GrantCourseAccessInput = {},
): Promise<UserServiceResult<ActiveCourseAccess>> {
  try {
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!course) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Kurs wurde nicht gefunden.",
      });
    }

    const now = new Date();
    const expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

    const access = await prisma.userCourseAccess.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: {
        userId,
        courseId,
        status: "active",
        source: "manual",
        grantedAt: now,
        expiresAt,
        note: input.note?.trim() || null,
        adminGrantedByUserId: actorUserId,
      },
      update: {
        status: "active",
        source: "manual",
        grantedAt: now,
        expiresAt,
        revokedAt: null,
        note: input.note?.trim() || null,
        adminGrantedByUserId: actorUserId,
      },
    });

    return userSuccess({
      courseId,
      status: access.status,
      source: access.source,
      grantedAt: access.grantedAt?.toISOString() ?? null,
      expiresAt: access.expiresAt?.toISOString() ?? null,
    });
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Kurszugriff konnte nicht gewährt werden.",
    });
  }
}

/**
 * Admin/Buchhaltung: Kurszugriff sperren.
 */
export async function revokeUserCourseAccess(
  userId: string,
  courseId: string,
  note?: string | null,
): Promise<UserServiceResult<true>> {
  try {
    const existing = await prisma.userCourseAccess.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (!existing) {
      return userFailure({
        code: "NOT_FOUND",
        message: "Kein Kurszugriff für diesen Nutzer vorhanden.",
      });
    }

    await prisma.userCourseAccess.update({
      where: { id: existing.id },
      data: {
        status: "revoked",
        revokedAt: new Date(),
        note: note?.trim() || existing.note,
      },
    });

    return userSuccess(true);
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Kurszugriff konnte nicht gesperrt werden.",
    });
  }
}

/**
 * Admin/Buchhaltung: Kurszugriff verlängern.
 */
export async function extendUserCourseAccess(
  userId: string,
  courseId: string,
  expiresAt: string,
): Promise<UserServiceResult<ActiveCourseAccess>> {
  try {
    const parsed = new Date(expiresAt);

    if (Number.isNaN(parsed.getTime())) {
      return userFailure({
        code: "VALIDATION_ERROR",
        message: "Ungültiges Ablaufdatum.",
      });
    }

    const access = await prisma.userCourseAccess.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: {
        userId,
        courseId,
        status: "active",
        source: "manual",
        grantedAt: new Date(),
        expiresAt: parsed,
      },
      update: {
        status: "active",
        expiresAt: parsed,
        revokedAt: null,
      },
    });

    return userSuccess({
      courseId,
      status: access.status,
      source: access.source,
      grantedAt: access.grantedAt?.toISOString() ?? null,
      expiresAt: access.expiresAt?.toISOString() ?? null,
    });
  } catch {
    return userFailure({
      code: "INTERNAL_ERROR",
      message: "Kurszugriff konnte nicht verlängert werden.",
    });
  }
}

export type UserCourseAccessEntry = {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  status: CourseAccessStatus;
  source: CourseAccessSource;
  grantedAt: string | null;
  expiresAt: string | null;
  note: string | null;
};

/**
 * Listet Kurszugriffe eines Nutzers (Admin/Buchhaltung).
 */
export async function listUserCourseAccessEntries(
  userId: string,
): Promise<UserCourseAccessEntry[]> {
  const rows = await prisma.userCourseAccess.findMany({
    where: { userId },
    include: {
      course: { select: { title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    courseId: row.courseId,
    courseTitle: row.course.title,
    courseSlug: row.course.slug,
    status: row.status,
    source: row.source,
    grantedAt: row.grantedAt?.toISOString() ?? null,
    expiresAt: row.expiresAt?.toISOString() ?? null,
    note: row.note,
  }));
}

/**
 * Gewährt Kurszugriff nach bezahlter Buchhaltungsposition (ohne Checkout).
 */
export async function grantCourseAccessFromAccountingPosition(input: {
  userId: string;
  positionId: string;
  productPriceId: string;
}): Promise<void> {
  const price = await prisma.productPrice.findUnique({
    where: { id: input.productPriceId },
    include: { product: { include: { course: true } } },
  });

  if (!price?.product?.course) {
    return;
  }

  const now = new Date();

  await prisma.userCourseAccess.upsert({
    where: {
      userId_courseId: {
        userId: input.userId,
        courseId: price.product.course.id,
      },
    },
    create: {
      userId: input.userId,
      courseId: price.product.course.id,
      status: "active",
      source: "accounting",
      grantedAt: now,
      note: `Buchhaltungsposition ${input.positionId}`,
    },
    update: {
      status: "active",
      source: "accounting",
      grantedAt: now,
      revokedAt: null,
      note: `Buchhaltungsposition ${input.positionId}`,
    },
  });
}
