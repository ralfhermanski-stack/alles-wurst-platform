/**
 * @file forum-permission-kinds.ts
 * @purpose Admin-Berechtigungsarten — Mapping zwischen UI-Auswahl und DB-Feldern.
 */

import type {
  Forum,
  ForumReadAccess,
  ForumType,
  MembershipRole,
} from "@prisma/client";

/** Admin-Auswahl für Forum-Berechtigungsart */
export type ForumPermissionKind =
  | "general_public"
  | "general_registered"
  | "course"
  | "mini_course_global"
  | "membership_wurstclub"
  | "membership_meisterclub";

export const FORUM_PERMISSION_KINDS: ForumPermissionKind[] = [
  "general_public",
  "general_registered",
  "course",
  "mini_course_global",
  "membership_wurstclub",
  "membership_meisterclub",
];

export const FORUM_PERMISSION_KIND_LABELS: Record<ForumPermissionKind, string> = {
  general_public: "Allgemein (öffentlich lesbar)",
  general_registered: "Registrierte User",
  course: "Kursforum",
  mini_course_global: "Minikurs-Forum",
  membership_wurstclub: "Wurstclub-Forum",
  membership_meisterclub: "Meisterclub-Forum",
};

export type ForumPermissionFields = {
  forumType: ForumType;
  readAccess: ForumReadAccess;
  requiredMembershipRole: MembershipRole | null;
};

export function fieldsFromPermissionKind(
  kind: ForumPermissionKind,
): ForumPermissionFields {
  switch (kind) {
    case "general_public":
      return {
        forumType: "general",
        readAccess: "public",
        requiredMembershipRole: null,
      };
    case "general_registered":
      return {
        forumType: "general",
        readAccess: "registered",
        requiredMembershipRole: null,
      };
    case "course":
      return {
        forumType: "course",
        readAccess: "course_access",
        requiredMembershipRole: null,
      };
    case "mini_course_global":
      return {
        forumType: "mini_course_global",
        readAccess: "mini_course_access",
        requiredMembershipRole: null,
      };
    case "membership_wurstclub":
      return {
        forumType: "membership",
        readAccess: "membership",
        requiredMembershipRole: "wurstclub",
      };
    case "membership_meisterclub":
      return {
        forumType: "membership",
        readAccess: "membership",
        requiredMembershipRole: "meisterclub",
      };
    default:
      return {
        forumType: "general",
        readAccess: "registered",
        requiredMembershipRole: null,
      };
  }
}

export function permissionKindFromForum(forum: {
  forumType: ForumType;
  readAccess: ForumReadAccess;
  requiredMembershipRole: MembershipRole | null;
}): ForumPermissionKind {
  switch (forum.forumType) {
    case "course":
      return "course";
    case "mini_course_global":
      return "mini_course_global";
    case "membership":
      if (forum.requiredMembershipRole === "meisterclub") {
        return "membership_meisterclub";
      }

      return "membership_wurstclub";
    default:
      return forum.readAccess === "public"
        ? "general_public"
        : "general_registered";
  }
}

export function permissionKindRequiresCourse(
  kind: ForumPermissionKind,
): boolean {
  return kind === "course";
}

export function permissionKindAllowsOptionalCourse(
  kind: ForumPermissionKind,
): boolean {
  return kind === "mini_course_global";
}
