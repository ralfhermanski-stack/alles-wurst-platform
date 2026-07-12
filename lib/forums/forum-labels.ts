/**
 * @file forum-labels.ts
 * @purpose Deutsche Bezeichnungen für Forum-Zugriffsregeln.
 */

import type { ForumReadAccess, ForumType, MembershipRole } from "@prisma/client";

import { MEMBERSHIP_ROLE_LABELS } from "@/lib/membership/membership-labels";

export const FORUM_TYPE_LABELS: Record<ForumType, string> = {
  course: "Kursforum",
  mini_course_global: "Minikurs-Forum",
  general: "Allgemeines Forum",
  membership: "Clubforum",
};

export { FORUM_PERMISSION_KIND_LABELS } from "./forum-permission-kinds";

export const FORUM_READ_ACCESS_LABELS: Record<ForumReadAccess, string> = {
  public: "Öffentlich lesbar",
  registered: "Registrierte Nutzer",
  course_access: "Aktiver Kurszugriff",
  membership: "Aktive Mitgliedschaft",
  mini_course_access: "Minikurs-Zugriff",
};

export function describeForumReadRule(input: {
  forumType: ForumType;
  readAccess: ForumReadAccess;
  requiredMembershipRole: MembershipRole | null;
  courseTitle: string | null;
}): string {
  if (input.forumType === "course") {
    return input.courseTitle
      ? `Kurszugriff: ${input.courseTitle}`
      : FORUM_READ_ACCESS_LABELS.course_access;
  }

  if (input.forumType === "mini_course_global") {
    if (input.courseTitle) {
      return `Minikurs-Zugriff: ${input.courseTitle}`;
    }

    return FORUM_READ_ACCESS_LABELS.mini_course_access;
  }

  if (input.forumType === "membership") {
    const role = input.requiredMembershipRole
      ? MEMBERSHIP_ROLE_LABELS[input.requiredMembershipRole]
      : "Mitgliedschaft";

    return `Aktive Mitgliedschaft: ${role}`;
  }

  return FORUM_READ_ACCESS_LABELS[input.readAccess];
}

export function describeForumWriteRule(writeEnabled: boolean): string {
  return writeEnabled
    ? "Eingeloggte Nutzer mit Leserecht dürfen schreiben"
    : "Nur Lesen (Schreiben deaktiviert)";
}

export function getPublicAuthorBadge(
  systemRole: string | null | undefined,
): string | null {
  switch (systemRole) {
    case "ADMIN":
      return "Admin";
    case "INSTRUCTOR":
      return "Dozent";
    case "SUPPORT":
      return "Support";
    default:
      return null;
  }
}
