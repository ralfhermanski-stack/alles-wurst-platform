/**
 * @file forum-permissions.ts
 * @purpose Zentrale Forum-Rechte: Lesen, Schreiben, Moderieren.
 *
 * TODO(später): Separates Nachrichtensystem unter /mein-bereich/nachrichten
 * für Supportfälle und private Kursfragen — keine Foren-Direktnachrichten.
 */

import type {
  Forum,
  ForumReadAccess,
  ForumType,
  MembershipRole,
  MembershipStatus,
  UserAccountStatus,
  UserSystemRole,
} from "@prisma/client";

import { hasAdminPermission } from "@/lib/admin/admin-permissions";
import { hasPermission } from "@/lib/permissions/permission-service";
import { hasActiveCourseAccess } from "@/lib/courses/course-access-service";
import { isLoginAllowed } from "@/lib/users/account-status";
import { findUserById } from "@/lib/users/user-service";
import { isAdminSystemRole } from "@/lib/users/system-role";

import { prisma } from "@/lib/db/prisma";

import { hasAnyMiniCourseAccess } from "./forum-access-helpers";
import { isMiniCourseGlobalForumsEnabled } from "./system-settings-service";

export type ForumPermissionContext = {
  userId: string | null;
  systemRole: UserSystemRole | null;
  accountStatus: UserAccountStatus | null;
  deletedAt: Date | null;
  membershipRole: MembershipRole | null;
  membershipStatus: MembershipStatus | null;
  membershipAccessBlocked: boolean;
  membershipEndsAt: Date | null;
  membershipExtendedUntil: Date | null;
};

const MEMBERSHIP_RANK: Record<MembershipRole, number> = {
  guest: 0,
  registered: 1,
  wurstclub: 2,
  meisterclub: 3,
  accounting: 4,
  admin: 5,
};

function isActiveMembership(context: ForumPermissionContext): boolean {
  if (
    !context.membershipRole ||
    context.membershipStatus !== "active" ||
    context.membershipAccessBlocked
  ) {
    return false;
  }

  const end =
    context.membershipExtendedUntil ?? context.membershipEndsAt ?? null;

  if (end && end.getTime() < Date.now()) {
    return false;
  }

  return true;
}

function membershipMeetsRole(
  userRole: MembershipRole,
  requiredRole: MembershipRole,
): boolean {
  return MEMBERSHIP_RANK[userRole] >= MEMBERSHIP_RANK[requiredRole];
}

function isAccountWritable(context: ForumPermissionContext): boolean {
  if (!context.userId) {
    return false;
  }

  return isLoginAllowed(context.accountStatus, context.deletedAt);
}

export async function loadForumPermissionContext(
  userId: string | null,
): Promise<ForumPermissionContext> {
  if (!userId) {
    return {
      userId: null,
      systemRole: null,
      accountStatus: null,
      deletedAt: null,
      membershipRole: null,
      membershipStatus: null,
      membershipAccessBlocked: false,
      membershipEndsAt: null,
      membershipExtendedUntil: null,
    };
  }

  const userResult = await findUserById(userId);

  if (!userResult.success || !userResult.data) {
    return {
      userId,
      systemRole: null,
      accountStatus: null,
      deletedAt: null,
      membershipRole: null,
      membershipStatus: null,
      membershipAccessBlocked: false,
      membershipEndsAt: null,
      membershipExtendedUntil: null,
    };
  }

  const user = userResult.data;

  return {
    userId,
    systemRole: user.systemRole,
    accountStatus: user.accountStatus,
    deletedAt: user.deletedAt,
    membershipRole: user.membership?.role ?? null,
    membershipStatus: user.membership?.status ?? null,
    membershipAccessBlocked: user.membership?.accessBlocked ?? false,
    membershipEndsAt: user.membership?.endsAt ?? null,
    membershipExtendedUntil: user.membership?.extendedUntil ?? null,
  };
}

function isStaffReader(context: ForumPermissionContext): boolean {
  if (!context.systemRole) {
    return false;
  }

  if (isAdminSystemRole(context.systemRole)) {
    return true;
  }

  if (hasAdminPermission(context.systemRole, "forums.moderate")) {
    return true;
  }

  return false;
}

function isInstructorForCourseForum(
  context: ForumPermissionContext,
  forum: Forum,
): boolean {
  return (
    context.systemRole === "INSTRUCTOR" &&
    (forum.forumType === "course" || forum.forumType === "mini_course_global")
  );
}

function resolveReadAccess(forum: Forum): ForumReadAccess {
  switch (forum.forumType as ForumType) {
    case "course":
      return "course_access";
    case "mini_course_global":
      return "mini_course_access";
    case "membership":
      return "membership";
    default:
      return forum.readAccess;
  }
}

/** Kurs-/Minikurs-Foren mit Buchungsbindung — nicht pauschal für Meisterclub offen */
export function isEnrollmentGatedForum(forum: Pick<Forum, "forumType" | "courseId">): boolean {
  if (forum.forumType === "course") {
    return true;
  }

  return forum.forumType === "mini_course_global" && Boolean(forum.courseId);
}

function isActiveMeisterclub(context: ForumPermissionContext): boolean {
  return isActiveMembership(context) && context.membershipRole === "meisterclub";
}

async function evaluateReadAccess(
  context: ForumPermissionContext,
  forum: Forum,
): Promise<boolean> {
  const readAccess = resolveReadAccess(forum);

  switch (readAccess) {
    case "public":
      return true;

    case "registered":
      return isAccountWritable(context);

    case "course_access":
      if (!context.userId || !forum.courseId) {
        return false;
      }

      return hasActiveCourseAccess(context.userId, forum.courseId);

    case "mini_course_access": {
      if (!context.userId) {
        return false;
      }

      const enabled = await isMiniCourseGlobalForumsEnabled();

      if (!enabled) {
        return false;
      }

      if (forum.courseId) {
        const course = await prisma.course.findUnique({
          where: { id: forum.courseId },
          select: { courseType: true },
        });

        if (course?.courseType !== "minikurs") {
          return false;
        }

        return hasActiveCourseAccess(context.userId, forum.courseId);
      }

      return hasAnyMiniCourseAccess(context.userId);
    }

    case "membership": {
      if (!isActiveMembership(context)) {
        return false;
      }

      const requiredRole = forum.requiredMembershipRole ?? "registered";

      return membershipMeetsRole(context.membershipRole!, requiredRole);
    }

    default:
      return false;
  }
}

/**
 * Darf der Nutzer das Forum anhand der ID lesen?
 */
export async function canReadForumById(
  userId: string | null,
  forumId: string,
): Promise<boolean> {
  const forum = await prisma.forum.findUnique({ where: { id: forumId } });

  if (!forum) {
    return false;
  }

  return canReadForum(userId, forum);
}

/**
 * Darf der Nutzer das Forum lesen (und öffnen)?
 */
export async function canReadForum(
  userId: string | null,
  forum: Forum,
  context?: ForumPermissionContext,
): Promise<boolean> {
  const ctx = context ?? (await loadForumPermissionContext(userId));

  if (!forum.isActive) {
    return isStaffReader(ctx) || isInstructorForCourseForum(ctx, forum);
  }

  if (isStaffReader(ctx)) {
    return true;
  }

  if (isInstructorForCourseForum(ctx, forum)) {
    return true;
  }

  if (!isAccountWritable(ctx) && resolveReadAccess(forum) !== "public") {
    return false;
  }

  // Meisterclub: alle Foren außer ungebuchten Kurs-/Minikurs-Foren
  if (isActiveMeisterclub(ctx) && !isEnrollmentGatedForum(forum)) {
    if (ctx.userId) {
      const hasForumPermission = await hasPermission(ctx.userId, "forum.open");

      if (!hasForumPermission && resolveReadAccess(forum) !== "public") {
        return false;
      }
    }

    return true;
  }

  const canRead = await evaluateReadAccess(ctx, forum);

  if (!canRead) {
    return false;
  }

  if (ctx.userId) {
    const hasForumPermission = await hasPermission(ctx.userId, "forum.open");

    if (!hasForumPermission && resolveReadAccess(forum) !== "public") {
      return false;
    }
  }

  return true;
}

/**
 * Sichtbarkeit in der Übersicht:
 * - Kursforen ohne Buchung: ausblenden
 * - Clubforen ohne Zugang: als gesperrter Teaser mit Badge
 */
export async function getForumOverviewVisibility(
  userId: string | null,
  forum: Forum,
  context?: ForumPermissionContext,
): Promise<{ visible: boolean; canOpen: boolean }> {
  const ctx = context ?? (await loadForumPermissionContext(userId));
  const canOpen = await canReadForum(userId, forum, ctx);

  if (canOpen) {
    return { visible: true, canOpen: true };
  }

  if (!forum.isActive) {
    return { visible: false, canOpen: false };
  }

  if (isEnrollmentGatedForum(forum)) {
    return { visible: false, canOpen: false };
  }

  if (
    forum.forumType === "membership" &&
    isAccountWritable(ctx) &&
    ctx.userId
  ) {
    return { visible: true, canOpen: false };
  }

  return { visible: false, canOpen: false };
}

/**
 * Darf der Nutzer im Forum schreiben (Threads/Beiträge)?
 */
export async function canWriteForum(
  userId: string | null,
  forum: Forum,
  context?: ForumPermissionContext,
): Promise<boolean> {
  const ctx = context ?? (await loadForumPermissionContext(userId));

  if (!forum.writeEnabled) {
    return isStaffReader(ctx) || isInstructorForCourseForum(ctx, forum);
  }

  if (!isAccountWritable(ctx)) {
    return false;
  }

  if (isStaffReader(ctx)) {
    return true;
  }

  if (isInstructorForCourseForum(ctx, forum)) {
    return true;
  }

  return canReadForum(userId, forum, ctx);
}

/**
 * Darf der Nutzer im Forum moderieren?
 */
export async function canModerateForum(
  userId: string | null,
  forum: Forum,
  context?: ForumPermissionContext,
): Promise<boolean> {
  const ctx = context ?? (await loadForumPermissionContext(userId));

  if (!ctx.systemRole) {
    return false;
  }

  if (isAdminSystemRole(ctx.systemRole)) {
    return true;
  }

  return hasAdminPermission(ctx.systemRole, "forums.moderate");
}

/** @deprecated Nutze canReadForum */
export async function canUserAccessForum(
  userId: string | null,
  forum: Forum,
): Promise<boolean> {
  return canReadForum(userId, forum);
}

export function forumNotFoundError() {
  return {
    code: "NOT_FOUND" as const,
    message: "Forum nicht gefunden.",
  };
}

export function threadNotFoundError() {
  return {
    code: "NOT_FOUND" as const,
    message: "Thema nicht gefunden.",
  };
}
