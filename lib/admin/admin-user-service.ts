/**
 * @file admin-user-service.ts
 * @purpose Benutzerverwaltung für Administratoren.
 */

import type {
  MembershipRole,
  UserAccountStatus,
  UserSystemRole,
} from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import {
  USER_ACCOUNT_STATUS_LABELS,
} from "@/lib/users/account-status";
import { getPublicUserName } from "@/lib/users/public-user";
import {
  USER_SYSTEM_ROLE_LABELS,
  USER_SYSTEM_ROLE_OPTIONS,
} from "@/lib/users/system-role";
import { MEMBERSHIP_ROLE_LABELS } from "@/lib/membership/membership-labels";
import { syncMembershipGroupForUser } from "@/lib/permissions/permission-seed";
import { assertCanChangeUserSystemRole } from "@/lib/permissions/superadmin-guard";
import {
  grantUserCourseAccess,
  revokeUserCourseAccess,
} from "@/lib/courses/course-access-service";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

import {
  createAdminAuditLog,
  listAdminUserAuditLogs,
  type AdminAuditEntry,
} from "./admin-audit";

export type AdminUserListEntry = {
  id: string;
  displayName: string;
  email: string;
  publicName: string | null;
  accountStatus: UserAccountStatus;
  accountStatusLabel: string;
  systemRole: UserSystemRole;
  systemRoleLabel: string;
  membershipRole: string | null;
  membershipStatus: string | null;
  createdAt: string;
  lastLoginAt: string | null;
};

export type AdminUserDetail = AdminUserListEntry & {
  maintenanceBypass: boolean;
  membershipId: string | null;
  profile: {
    firstName: string;
    lastName: string;
    bio: string | null;
    phone: string | null;
    city: string;
    country: string;
  } | null;
  courses: Array<{
    id: string;
    title: string;
    slug: string;
    grantedAt: string;
  }>;
  certificates: Array<{
    id: string;
    certificateNumber: string;
    courseTitle: string;
    status: string;
    issuedAt: string;
  }>;
  reviews: Array<{
    id: string;
    courseTitle: string;
    rating: number;
    status: string;
    createdAt: string;
  }>;
  orders: Array<{
    id: string;
    title: string;
    grossAmount: string;
    paymentStatus: string;
    createdAt: string;
  }>;
  auditLog: AdminAuditEntry[];
};

const ASSIGNABLE_MEMBERSHIP_ROLES: MembershipRole[] = [
  "registered",
  "wurstclub",
  "meisterclub",
];

async function countActiveAdmins(excludeUserId?: string): Promise<number> {
  return prisma.user.count({
    where: {
      systemRole: "ADMIN",
      accountStatus: "active",
      deletedAt: null,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
    },
  });
}

async function getUserForAdminOrFail(
  userId: string,
): Promise<
  UserServiceResult<{
    id: string;
    email: string;
    systemRole: UserSystemRole;
    accountStatus: UserAccountStatus;
    maintenanceBypass: boolean;
    deletedAt: Date | null;
    createdAt: Date;
    lastLoginAt: Date | null;
    profile: {
      firstName: string;
      lastName: string;
      publicName: string | null;
    } | null;
    membership: { id: string; role: string; status: string } | null;
  }>
> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true, membership: true },
  });

  if (!user) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Nutzer nicht gefunden.",
    });
  }

  return userSuccess(user);
}

function assertNotSelfAction(
  targetUserId: string,
  actorUserId: string,
  message: string,
): UserServiceResult<AdminUserListEntry> | null {
  if (targetUserId === actorUserId) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message,
    });
  }

  return null;
}

async function assertNotLastAdmin(
  targetUserId: string,
  message: string,
): Promise<UserServiceResult<AdminUserListEntry> | null> {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { systemRole: true },
  });

  if (user?.systemRole !== "ADMIN") {
    return null;
  }

  const others = await countActiveAdmins(targetUserId);

  if (others === 0) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message,
    });
  }

  return null;
}

function toListEntry(user: {
  id: string;
  email: string;
  systemRole: UserSystemRole;
  accountStatus: UserAccountStatus;
  createdAt: Date;
  lastLoginAt: Date | null;
  profile: {
    firstName: string;
    lastName: string;
    publicName: string | null;
  } | null;
  membership: { role: string; status: string } | null;
}): AdminUserListEntry {
  return {
    id: user.id,
    displayName: getPublicUserName({ profile: user.profile }),
    email: user.email,
    publicName: user.profile?.publicName ?? null,
    accountStatus: user.accountStatus,
    accountStatusLabel: USER_ACCOUNT_STATUS_LABELS[user.accountStatus],
    systemRole: user.systemRole,
    systemRoleLabel: USER_SYSTEM_ROLE_LABELS[user.systemRole],
    membershipRole: user.membership
      ? (MEMBERSHIP_ROLE_LABELS[
          user.membership.role as keyof typeof MEMBERSHIP_ROLE_LABELS
        ] ?? user.membership.role)
      : null,
    membershipStatus: user.membership?.status ?? null,
    createdAt: user.createdAt.toISOString(),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
  };
}

export async function listAdminUsers(
  search?: string,
): Promise<AdminUserListEntry[]> {
  const query = search?.trim();

  const users = await prisma.user.findMany({
    where: {
      ...(query
        ? {
            OR: [
              { email: { contains: query, mode: "insensitive" } },
              {
                profile: {
                  is: {
                    OR: [
                      { firstName: { contains: query, mode: "insensitive" } },
                      { lastName: { contains: query, mode: "insensitive" } },
                      { publicName: { contains: query, mode: "insensitive" } },
                    ],
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: { profile: true, membership: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return users.map(toListEntry);
}

export async function getAdminUserDetail(
  userId: string,
): Promise<UserServiceResult<AdminUserDetail>> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      membership: true,
      userCourseAccess: {
        where: { revokedAt: null, status: "active" },
        include: { course: { select: { id: true, title: true, slug: true } } },
        orderBy: { grantedAt: "desc" },
      },
      courseCertificates: {
        include: { course: { select: { title: true } } },
        orderBy: { issuedAt: "desc" },
      },
      courseReviews: {
        include: { course: { select: { title: true } } },
        orderBy: { createdAt: "desc" },
      },
      accountingPositions: {
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!user) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Nutzer nicht gefunden.",
    });
  }

  const base = toListEntry(user);
  const auditLog = await listAdminUserAuditLogs(userId);

  return userSuccess({
    ...base,
    maintenanceBypass: user.maintenanceBypass,
    membershipId: user.membership?.id ?? null,
    profile: user.profile
      ? {
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          bio: user.profile.bio,
          phone: user.profile.phone,
          city: user.profile.city,
          country: user.profile.country,
        }
      : null,
    courses: user.userCourseAccess.map((access) => ({
      id: access.course.id,
      title: access.course.title,
      slug: access.course.slug,
      grantedAt: (access.grantedAt ?? access.createdAt).toISOString(),
    })),
    certificates: user.courseCertificates.map((cert) => ({
      id: cert.id,
      certificateNumber: cert.certificateNumber ?? "—",
      courseTitle: cert.course.title,
      status: cert.status,
      issuedAt: (cert.issuedAt ?? cert.createdAt).toISOString(),
    })),
    reviews: user.courseReviews.map((review) => ({
      id: review.id,
      courseTitle: review.course.title,
      rating: review.rating,
      status: review.status,
      createdAt: review.createdAt.toISOString(),
    })),
    orders: user.accountingPositions.map((position) => ({
      id: position.id,
      title: position.productName,
      grossAmount: position.grossAmount.toString(),
      paymentStatus: position.paymentStatus,
      createdAt: position.createdAt.toISOString(),
    })),
    auditLog,
  });
}

export async function updateAdminUserAccountStatus(
  userId: string,
  accountStatus: UserAccountStatus,
  actorUserId: string,
  note?: string | null,
): Promise<UserServiceResult<AdminUserListEntry>> {
  if (!["active", "suspended", "deactivated"].includes(accountStatus)) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Ungültiger Kontostatus.",
    });
  }

  const userResult = await getUserForAdminOrFail(userId);

  if (!userResult.success) {
    return userResult;
  }

  const user = userResult.data;
  const previousStatus = user.accountStatus;

  if (accountStatus === "suspended") {
    const selfBlock = assertNotSelfAction(
      userId,
      actorUserId,
      "Du kannst dein eigenes Konto nicht sperren.",
    );

    if (selfBlock) {
      return selfBlock;
    }
  }

  if (accountStatus === "deactivated") {
    const selfBlock = assertNotSelfAction(
      userId,
      actorUserId,
      "Du kannst dein eigenes Konto nicht deaktivieren.",
    );

    if (selfBlock) {
      return selfBlock;
    }

    const lastAdminBlock = await assertNotLastAdmin(
      userId,
      "Der letzte Administrator kann nicht deaktiviert werden.",
    );

    if (lastAdminBlock) {
      return lastAdminBlock;
    }
  }

  if (
    user.systemRole === "ADMIN" &&
    accountStatus !== "active"
  ) {
    const lastAdminBlock = await assertNotLastAdmin(
      userId,
      "Der letzte Administrator kann nicht gesperrt oder deaktiviert werden.",
    );

    if (lastAdminBlock) {
      return lastAdminBlock;
    }
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      accountStatus,
      deletedAt: accountStatus === "deactivated" ? new Date() : null,
    },
    include: { profile: true, membership: true },
  });

  const auditAction =
    accountStatus === "active"
      ? "user_activate"
      : accountStatus === "suspended"
        ? "user_suspend"
        : "user_deactivate";

  const auditLabel =
    accountStatus === "active"
      ? "Konto aktiviert"
      : accountStatus === "suspended"
        ? "Konto gesperrt"
        : "Konto deaktiviert";

  await createAdminAuditLog({
    targetUserId: userId,
    actorUserId,
    action: auditAction,
    summary: auditLabel,
    previousValues: { accountStatus: previousStatus },
    newValues: { accountStatus },
    note,
  });

  return userSuccess(toListEntry(updated));
}

export async function updateAdminUserSystemRole(
  userId: string,
  systemRole: UserSystemRole,
  actorUserId: string,
  note?: string | null,
): Promise<UserServiceResult<AdminUserListEntry>> {
  if (!USER_SYSTEM_ROLE_OPTIONS.includes(systemRole)) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Ungültige Systemrolle.",
    });
  }

  const userResult = await getUserForAdminOrFail(userId);

  if (!userResult.success) {
    return userResult;
  }

  const user = userResult.data;
  const previousRole = user.systemRole;

  if (userId === actorUserId && systemRole !== "ADMIN") {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Du kannst deine eigene Admin-Rolle nicht entfernen.",
    });
  }

  if (previousRole === "ADMIN" && systemRole !== "ADMIN" && systemRole !== "SUPERADMIN") {
    const lastAdminBlock = await assertNotLastAdmin(
      userId,
      "Der letzte Administrator kann nicht degradiert werden.",
    );

    if (lastAdminBlock) {
      return lastAdminBlock;
    }
  }

  try {
    await assertCanChangeUserSystemRole({
      actorUserId,
      targetUserId: userId,
      newRole: systemRole,
    });
  } catch (error) {
    return userFailure({
      code: "FORBIDDEN",
      message:
        error instanceof Error ? error.message : "Rollenänderung nicht erlaubt.",
    });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { systemRole },
    include: { profile: true, membership: true },
  });

  await createAdminAuditLog({
    targetUserId: userId,
    actorUserId,
    action: "system_role_change",
    summary: `Systemrolle geändert: ${USER_SYSTEM_ROLE_LABELS[previousRole]} → ${USER_SYSTEM_ROLE_LABELS[systemRole]}`,
    previousValues: { systemRole: previousRole },
    newValues: { systemRole },
    note,
  });

  return userSuccess(toListEntry(updated));
}

export async function updateAdminUserMaintenanceBypass(
  userId: string,
  maintenanceBypass: boolean,
  actorUserId: string,
  note?: string | null,
): Promise<UserServiceResult<AdminUserDetail>> {
  const userResult = await getUserForAdminOrFail(userId);

  if (!userResult.success) {
    return userResult;
  }

  const user = userResult.data;
  const previous = user.maintenanceBypass;

  await prisma.user.update({
    where: { id: userId },
    data: { maintenanceBypass },
  });

  await createAdminAuditLog({
    targetUserId: userId,
    actorUserId,
    action: "manual_update",
    summary: `Wartungsmodus-Bypass: ${previous ? "ja" : "nein"} → ${maintenanceBypass ? "ja" : "nein"}`,
    previousValues: { maintenanceBypass: previous },
    newValues: { maintenanceBypass },
    note,
  });

  return getAdminUserDetail(userId);
}

export async function grantAdminUserCourse(
  userId: string,
  courseId: string,
  actorUserId: string,
  input: { expiresAt?: string | null; note?: string | null } = {},
): Promise<UserServiceResult<AdminUserListEntry>> {
  const userResult = await getUserForAdminOrFail(userId);

  if (!userResult.success) {
    return userResult;
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true },
  });

  if (!course) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Kurs wurde nicht gefunden.",
    });
  }

  const grantResult = await grantUserCourseAccess(
    actorUserId,
    userId,
    courseId,
    input,
  );

  if (!grantResult.success) {
    return grantResult;
  }

  await createAdminAuditLog({
    targetUserId: userId,
    actorUserId,
    action: "course_access_grant",
    summary: `Kurs freigeschaltet: ${course.title}`,
    newValues: { courseId, courseTitle: course.title },
    note: input.note,
  });

  const refreshed = await getUserForAdminOrFail(userId);

  if (!refreshed.success) {
    return refreshed;
  }

  return userSuccess(toListEntry(refreshed.data));
}

export async function revokeAdminUserCourse(
  userId: string,
  courseId: string,
  actorUserId: string,
  note?: string | null,
): Promise<UserServiceResult<AdminUserListEntry>> {
  const userResult = await getUserForAdminOrFail(userId);

  if (!userResult.success) {
    return userResult;
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true },
  });

  if (!course) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Kurs wurde nicht gefunden.",
    });
  }

  const revokeResult = await revokeUserCourseAccess(userId, courseId, note);

  if (!revokeResult.success) {
    return revokeResult;
  }

  await createAdminAuditLog({
    targetUserId: userId,
    actorUserId,
    action: "course_access_revoke",
    summary: `Kurszugang entzogen: ${course.title}`,
    previousValues: { courseId, courseTitle: course.title },
    note,
  });

  const refreshed = await getUserForAdminOrFail(userId);

  if (!refreshed.success) {
    return refreshed;
  }

  return userSuccess(toListEntry(refreshed.data));
}

export async function assignAdminUserMembership(
  userId: string,
  role: MembershipRole,
  actorUserId: string,
  input: {
    extendedUntil?: string | null;
    note?: string | null;
  } = {},
): Promise<UserServiceResult<AdminUserListEntry>> {
  if (!ASSIGNABLE_MEMBERSHIP_ROLES.includes(role)) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Diese Mitgliedschaftsrolle kann nicht manuell vergeben werden.",
    });
  }

  const userResult = await getUserForAdminOrFail(userId);

  if (!userResult.success) {
    return userResult;
  }

  const extendedUntil = input.extendedUntil
    ? new Date(input.extendedUntil)
    : null;

  if (input.extendedUntil && (!extendedUntil || Number.isNaN(extendedUntil.getTime()))) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Ungültiges Enddatum.",
    });
  }

  const existing = await prisma.membership.findUnique({
    where: { userId },
  });

  const now = new Date();
  const previousSnapshot = existing
    ? {
        role: existing.role,
        status: existing.status,
        endsAt: existing.endsAt?.toISOString() ?? null,
        extendedUntil: existing.extendedUntil?.toISOString() ?? null,
      }
    : null;

  const membership = existing
    ? await prisma.membership.update({
        where: { userId },
        data: {
          role,
          status: "active",
          accessBlocked: false,
          blockReason: null,
          startedAt: existing.startedAt ?? now,
          endsAt: null,
          extendedUntil,
        },
      })
    : await prisma.membership.create({
        data: {
          userId,
          role,
          status: "active",
          paymentStatus: "paid",
          startedAt: now,
          extendedUntil,
        },
      });

  await createAdminAuditLog({
    targetUserId: userId,
    actorUserId,
    action: "membership_reactivate",
    summary: `Mitgliedschaft vergeben: ${MEMBERSHIP_ROLE_LABELS[role]}`,
    previousValues: previousSnapshot,
    newValues: {
      role: membership.role,
      status: membership.status,
      extendedUntil: membership.extendedUntil?.toISOString() ?? null,
    },
    note: input.note,
  });

  await syncMembershipGroupForUser(userId);

  const refreshed = await getUserForAdminOrFail(userId);

  if (!refreshed.success) {
    return refreshed;
  }

  return userSuccess(toListEntry(refreshed.data));
}

export async function endAdminUserMembership(
  userId: string,
  membershipId: string,
  actorUserId: string,
  note?: string | null,
): Promise<UserServiceResult<AdminUserListEntry>> {
  const membership = await prisma.membership.findFirst({
    where: { id: membershipId, userId },
  });

  if (!membership) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Mitgliedschaft nicht gefunden.",
    });
  }

  const previousSnapshot = {
    role: membership.role,
    status: membership.status,
    endsAt: membership.endsAt?.toISOString() ?? null,
  };

  const updated = await prisma.membership.update({
    where: { id: membershipId },
    data: {
      status: "cancelled",
      endsAt: new Date(),
    },
  });

  await createAdminAuditLog({
    targetUserId: userId,
    actorUserId,
    action: "membership_end",
    summary: `Mitgliedschaft beendet: ${MEMBERSHIP_ROLE_LABELS[membership.role]}`,
    previousValues: previousSnapshot,
    newValues: {
      role: updated.role,
      status: updated.status,
      endsAt: updated.endsAt?.toISOString() ?? null,
    },
    note,
  });

  await syncMembershipGroupForUser(userId);

  const refreshed = await getUserForAdminOrFail(userId);

  if (!refreshed.success) {
    return refreshed;
  }

  return userSuccess(toListEntry(refreshed.data));
}

export { USER_SYSTEM_ROLE_OPTIONS, ASSIGNABLE_MEMBERSHIP_ROLES };
