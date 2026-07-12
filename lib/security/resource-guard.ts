/**
 * @file resource-guard.ts
 * @purpose Serverseitige Eigentums- und Berechtigungsprüfung für Ressourcen.
 */

import type { UserSystemRole } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { isLoginAllowed } from "@/lib/users/account-status";
import { isAdminSystemRole } from "@/lib/users/system-role";

export type ResourceGuardResult =
  | { allowed: true; userId: string; systemRole: UserSystemRole }
  | { allowed: false; code: "UNAUTHORIZED" | "FORBIDDEN" | "NOT_FOUND"; message: string };

export async function assertAuthenticatedActiveUser(
  userId: string | null,
): Promise<ResourceGuardResult> {
  if (!userId) {
    return { allowed: false, code: "UNAUTHORIZED", message: "Anmeldung erforderlich." };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, systemRole: true, accountStatus: true, deletedAt: true },
  });

  if (!user || user.deletedAt) {
    return { allowed: false, code: "UNAUTHORIZED", message: "Anmeldung erforderlich." };
  }

  if (!isLoginAllowed(user.accountStatus, user.deletedAt)) {
    return { allowed: false, code: "FORBIDDEN", message: "Konto gesperrt oder deaktiviert." };
  }

  return { allowed: true, userId: user.id, systemRole: user.systemRole };
}

export async function assertRecipeOwnership(
  recipeId: string,
  userId: string,
  allowAdmin = true,
): Promise<ResourceGuardResult> {
  const auth = await assertAuthenticatedActiveUser(userId);

  if (!auth.allowed) {
    return auth;
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { userId: true, deletedAt: true },
  });

  if (!recipe || recipe.deletedAt) {
    return { allowed: false, code: "NOT_FOUND", message: "Rezept nicht gefunden." };
  }

  if (recipe.userId === userId) {
    return auth;
  }

  if (allowAdmin && isAdminSystemRole(auth.systemRole)) {
    return auth;
  }

  return { allowed: false, code: "FORBIDDEN", message: "Kein Zugriff auf dieses Rezept." };
}

export async function assertTicketAccess(
  ticketId: string,
  userId: string,
): Promise<ResourceGuardResult> {
  const auth = await assertAuthenticatedActiveUser(userId);

  if (!auth.allowed) {
    return auth;
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    select: { userId: true, assignedToUserId: true },
  });

  if (!ticket) {
    return { allowed: false, code: "NOT_FOUND", message: "Ticket nicht gefunden." };
  }

  if (
    ticket.userId === userId
    || ticket.assignedToUserId === userId
    || isAdminSystemRole(auth.systemRole)
    || auth.systemRole === "SUPPORT"
  ) {
    return auth;
  }

  return { allowed: false, code: "FORBIDDEN", message: "Kein Zugriff auf dieses Ticket." };
}

export async function assertCertificateOwnership(
  certificateId: string,
  userId: string,
): Promise<ResourceGuardResult> {
  const auth = await assertAuthenticatedActiveUser(userId);

  if (!auth.allowed) {
    return auth;
  }

  const certificate = await prisma.userCourseCertificate.findUnique({
    where: { id: certificateId },
    select: { userId: true },
  });

  if (!certificate) {
    return { allowed: false, code: "NOT_FOUND", message: "Zertifikat nicht gefunden." };
  }

  if (certificate.userId === userId || isAdminSystemRole(auth.systemRole)) {
    return auth;
  }

  return { allowed: false, code: "FORBIDDEN", message: "Kein Zugriff auf dieses Zertifikat." };
}

export async function assertActiveMembership(userId: string): Promise<boolean> {
  const membership = await prisma.membership.findUnique({
    where: { userId },
    select: { status: true, accessBlocked: true, endsAt: true, extendedUntil: true },
  });

  if (!membership || membership.status !== "active" || membership.accessBlocked) {
    return false;
  }

  const end = membership.extendedUntil ?? membership.endsAt;

  if (end && end.getTime() < Date.now()) {
    return false;
  }

  return true;
}

export async function assertCourseAccess(
  courseId: string,
  userId: string,
): Promise<ResourceGuardResult> {
  const auth = await assertAuthenticatedActiveUser(userId);

  if (!auth.allowed) {
    return auth;
  }

  if (isAdminSystemRole(auth.systemRole)) {
    return auth;
  }

  const access = await prisma.userCourseAccess.findFirst({
    where: {
      userId,
      courseId,
      status: "active",
      revokedAt: null,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });

  if (!access) {
    return { allowed: false, code: "FORBIDDEN", message: "Kein Zugriff auf diesen Kurs." };
  }

  return auth;
}
