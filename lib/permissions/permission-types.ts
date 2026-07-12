/**
 * @file permission-types.ts
 * @purpose Typen für das granulare Berechtigungssystem.
 */

import type {
  MembershipRole,
  PermissionEffect,
  UserGroupStatus,
  UserSystemRole,
} from "@prisma/client";

export type { PermissionEffect, UserGroupStatus };

export type PermissionCategory =
  | "general"
  | "profile"
  | "membership"
  | "werkstatt"
  | "recipes"
  | "courses"
  | "certificates"
  | "diplomas"
  | "forum"
  | "tickets"
  | "blog"
  | "social"
  | "administration"
  | "accounting"
  | "payments"
  | "system"
  | "privacy";

export type PermissionActionKey =
  | "view"
  | "open"
  | "use"
  | "create"
  | "edit"
  | "delete"
  | "publish"
  | "manage"
  | "export"
  | "share"
  | "moderate";

export type PermissionCatalogEntry = {
  key: string;
  name: string;
  description: string;
  category: PermissionCategory;
  areaKey?: string;
  actionKey?: PermissionActionKey;
  isCritical?: boolean;
  superAdminOnly?: boolean;
  sortOrder?: number;
};

export type PermissionResolutionSource =
  | "user_deny"
  | "user_allow"
  | "group_deny"
  | "group_allow"
  | "membership"
  | "system_role"
  | "system_default"
  | "none";

export type ResolvedPermission = {
  key: string;
  allowed: boolean;
  source: PermissionResolutionSource;
  sourceLabel: string;
  groupId?: string;
  groupName?: string;
};

export type EffectivePermissionMap = Map<string, ResolvedPermission>;

export type UserGroupSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  internalNote: string | null;
  color: string | null;
  priority: number;
  isSystem: boolean;
  status: UserGroupStatus;
  linkedMembershipRole: MembershipRole | null;
  linkedSystemRole: UserSystemRole | null;
  memberCount: number;
  permissionCount: number;
  createdAt: string;
  updatedAt: string;
};

export type UserGroupDetail = UserGroupSummary & {
  permissions: Array<{
    permissionId: string;
    key: string;
    name: string;
    category: string;
    areaKey: string | null;
    actionKey: string | null;
    effect: PermissionEffect;
    isCritical: boolean;
  }>;
};

export type UserPermissionAssignment = {
  id: string;
  permissionId: string;
  key: string;
  name: string;
  effect: PermissionEffect;
  validFrom: string | null;
  validUntil: string | null;
};

export type UserRightsOverview = {
  systemRole: UserSystemRole;
  membershipRole: MembershipRole | null;
  membershipStatus: string | null;
  groups: Array<{
    id: string;
    name: string;
    slug: string;
    color: string | null;
    isManual: boolean;
    validFrom: string | null;
    validUntil: string | null;
  }>;
  individualPermissions: UserPermissionAssignment[];
  effectivePermissions: ResolvedPermission[];
};

export type PermissionCheckResult = {
  allowed: boolean;
  permissionKey: string;
  source: PermissionResolutionSource;
  sourceLabel: string;
  reason: string;
  groupName?: string;
  deniedBy?: string;
};

export const PERMISSION_ACTION_LABELS: Record<PermissionActionKey, string> = {
  view: "Anzeigen",
  open: "Öffnen",
  use: "Benutzen",
  create: "Erstellen",
  edit: "Bearbeiten",
  delete: "Löschen",
  publish: "Veröffentlichen",
  manage: "Verwalten",
  export: "Exportieren",
  share: "Teilen",
  moderate: "Moderieren",
};

export const PERMISSION_CATEGORY_LABELS: Record<PermissionCategory, string> = {
  general: "Allgemein",
  profile: "Profil",
  membership: "Mitgliedschaft",
  werkstatt: "Werkstatt",
  recipes: "Rezepte",
  courses: "Kurse",
  certificates: "Zertifikate",
  diplomas: "Urkunden",
  forum: "Forum",
  tickets: "Tickets",
  blog: "Blog",
  social: "Social Sharing",
  administration: "Administration",
  accounting: "Buchhaltung",
  payments: "Zahlungen",
  system: "System",
  privacy: "Datenschutz",
};
