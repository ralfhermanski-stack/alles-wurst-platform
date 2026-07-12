/**
 * @file forum-validation.ts
 * @purpose Validierung für Admin-Forum-Erstellung und -Bearbeitung.
 */

import { prisma } from "@/lib/db/prisma";
import type {
  ForumPurpose,
  ForumReadAccess,
  ForumType,
  MembershipRole,
} from "@prisma/client";
import type { UserServiceResult } from "@/lib/users/user-errors";
import { userFailure } from "@/lib/users/user-errors";

import {
  fieldsFromPermissionKind,
  type ForumPermissionKind,
  permissionKindAllowsOptionalCourse,
  permissionKindRequiresCourse,
} from "./forum-permission-kinds";
import type { CreateForumInput, UpdateForumInput } from "./forum-types";

export type NormalizedForumInput = {
  title: string;
  slug?: string;
  description: string | null;
  forumType: ForumType;
  forumPurpose: ForumPurpose;
  readAccess: ForumReadAccess;
  writeEnabled: boolean;
  requiredMembershipRole: MembershipRole | null;
  courseId: string | null;
  isActive: boolean;
  sortOrder: number;
};

type ValidationFailure = Extract<UserServiceResult<unknown>, { success: false }>;

function validationError(message: string): ValidationFailure {
  return userFailure({ code: "VALIDATION_ERROR", message });
}

export function normalizeCreateForumInput(
  input: CreateForumInput & { permissionKind?: ForumPermissionKind },
): UserServiceResult<NormalizedForumInput> {
  const title = input.title?.trim();

  if (!title) {
    return validationError("Forumname ist erforderlich.");
  }

  const permissionKind = input.permissionKind;

  if (!permissionKind && !input.forumType) {
    return validationError("Berechtigungsart ist erforderlich.");
  }

  const fields = permissionKind
    ? fieldsFromPermissionKind(permissionKind)
    : {
        forumType: input.forumType!,
        readAccess: input.readAccess ?? "registered",
        requiredMembershipRole: input.requiredMembershipRole ?? null,
      };

  const courseId = input.courseId ?? null;

  if (permissionKind && permissionKindRequiresCourse(permissionKind) && !courseId) {
    return validationError("Kursforum benötigt einen zugeordneten Kurs.");
  }

  if (
    permissionKind &&
    permissionKindAllowsOptionalCourse(permissionKind) &&
    courseId
  ) {
    // optional — wird unten geprüft
  }

  if (fields.forumType === "course" && !courseId) {
    return validationError("Kursforum benötigt einen zugeordneten Kurs.");
  }

  if (fields.forumType === "membership" && !fields.requiredMembershipRole) {
    return validationError("Clubforum benötigt ein Mitgliedschaftslevel.");
  }

  return {
    success: true,
    data: {
      title,
      slug: input.slug?.trim() || undefined,
      description: input.description?.trim() || null,
      forumType: fields.forumType,
      forumPurpose: input.forumPurpose ?? "custom",
      readAccess: fields.readAccess,
      writeEnabled: input.writeEnabled ?? true,
      requiredMembershipRole: fields.requiredMembershipRole,
      courseId,
      isActive: input.isActive ?? true,
      sortOrder: input.sortOrder ?? 100,
    },
  };
}

export async function validateForumCourseAssignment(
  forumType: NormalizedForumInput["forumType"],
  courseId: string | null,
): Promise<ValidationFailure | null> {
  if (!courseId) {
    return null;
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, courseType: true },
  });

  if (!course) {
    return validationError("Der gewählte Kurs existiert nicht.");
  }

  if (forumType === "course" && course.courseType === "minikurs") {
    return validationError(
      "Minikurse bitte über „Minikurs-Forum“ zuordnen, nicht als Kursforum.",
    );
  }

  if (forumType === "mini_course_global" && course.courseType !== "minikurs") {
    return validationError(
      "Minikurs-Forum kann nur einem Minikurs zugeordnet werden.",
    );
  }

  return null;
}

export async function normalizeUpdateForumInput(
  forumId: string,
  input: UpdateForumInput & { permissionKind?: ForumPermissionKind },
): Promise<UserServiceResult<Partial<NormalizedForumInput>>> {
  const existing = await prisma.forum.findUnique({ where: { id: forumId } });

  if (!existing) {
    return userFailure({
      code: "NOT_FOUND",
      message: "Forum nicht gefunden.",
    });
  }

  const permissionKind = input.permissionKind;
  const fields = permissionKind
    ? fieldsFromPermissionKind(permissionKind)
    : null;

  const forumType = fields?.forumType ?? input.forumType ?? existing.forumType;
  const readAccess = fields?.readAccess ?? input.readAccess ?? existing.readAccess;
  const requiredMembershipRole =
    fields?.requiredMembershipRole ??
    (input.requiredMembershipRole !== undefined
      ? input.requiredMembershipRole
      : existing.requiredMembershipRole);

  const courseId =
    input.courseId !== undefined ? input.courseId : existing.courseId;

  if (input.title !== undefined && !input.title.trim()) {
    return validationError("Forumname darf nicht leer sein.");
  }

  if (forumType === "course" && !courseId) {
    return validationError("Kursforum benötigt einen zugeordneten Kurs.");
  }

  if (forumType === "membership" && !requiredMembershipRole) {
    return validationError("Clubforum benötigt ein Mitgliedschaftslevel.");
  }

  const courseError = await validateForumCourseAssignment(forumType, courseId);

  if (courseError) {
    return courseError;
  }

  const normalized: Partial<NormalizedForumInput> = {};

  if (input.title !== undefined) {
    normalized.title = input.title.trim();
  }

  if (input.slug !== undefined) {
    normalized.slug = input.slug.trim();
  }

  if (input.description !== undefined) {
    normalized.description = input.description?.trim() || null;
  }

  if (
    permissionKind ||
    input.forumType !== undefined ||
    input.readAccess !== undefined ||
    input.requiredMembershipRole !== undefined
  ) {
    normalized.forumType = forumType;
    normalized.readAccess = readAccess;
    normalized.requiredMembershipRole = requiredMembershipRole;
  }

  if (input.courseId !== undefined || fields) {
    normalized.courseId = forumType === "membership" ? null : courseId;
  }

  if (input.writeEnabled !== undefined) {
    normalized.writeEnabled = input.writeEnabled;
  }

  if (input.isActive !== undefined) {
    normalized.isActive = input.isActive;
  }

  if (input.sortOrder !== undefined) {
    normalized.sortOrder = input.sortOrder;
  }

  if (input.forumPurpose !== undefined) {
    normalized.forumPurpose = input.forumPurpose;
  }

  return { success: true, data: normalized };
}
