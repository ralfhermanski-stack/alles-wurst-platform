/**
 * @file permissions-client.ts
 * @purpose Client-Helfer für Berechtigungs-Admin-APIs.
 */

import type { PermissionEffect } from "@prisma/client";

import type { AdminApiResponse } from "@/lib/admin/admin-fetch";
import { adminFetch } from "@/lib/admin/admin-fetch";

import type {
  PermissionCheckResult,
  UserGroupDetail,
  UserGroupSummary,
  UserRightsOverview,
} from "./permission-types";

export type PermissionCatalogItem = {
  key: string;
  name: string;
  description: string;
  category: string;
  areaKey: string | null;
  actionKey: string | null;
  isCritical: boolean;
  superAdminOnly: boolean;
};

export type PermissionAuditEntry = {
  id: string;
  action: string;
  actionLabel: string;
  actorUserId: string | null;
  targetUserId: string | null;
  targetGroupId: string | null;
  targetGroupName: string | null;
  permissionKey: string | null;
  summary: string;
  note: string | null;
  createdAt: string;
};

export async function listPermissionGroupsApi(): Promise<
  AdminApiResponse<UserGroupSummary[]>
> {
  return adminFetch<UserGroupSummary[]>("/api/admin/permissions/groups");
}

export async function getPermissionGroupApi(
  groupId: string,
): Promise<AdminApiResponse<UserGroupDetail>> {
  return adminFetch<UserGroupDetail>(`/api/admin/permissions/groups/${groupId}`);
}

export async function createPermissionGroupApi(input: {
  name: string;
  description?: string;
  internalNote?: string;
  color?: string;
  priority?: number;
}): Promise<AdminApiResponse<UserGroupSummary>> {
  return adminFetch<UserGroupSummary>("/api/admin/permissions/groups", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updatePermissionGroupApi(
  groupId: string,
  input: Record<string, unknown>,
): Promise<AdminApiResponse<UserGroupSummary>> {
  return adminFetch<UserGroupSummary>(`/api/admin/permissions/groups/${groupId}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function duplicatePermissionGroupApi(
  groupId: string,
): Promise<AdminApiResponse<UserGroupSummary>> {
  return adminFetch<UserGroupSummary>(
    `/api/admin/permissions/groups/${groupId}/duplicate`,
    { method: "POST" },
  );
}

export async function deletePermissionGroupApi(
  groupId: string,
): Promise<AdminApiResponse<{ deleted: boolean }>> {
  return adminFetch<{ deleted: boolean }>(
    `/api/admin/permissions/groups/${groupId}`,
    { method: "DELETE" },
  );
}

export async function saveGroupPermissionsApi(
  groupId: string,
  entries: Array<{ permissionKey: string; effect: PermissionEffect | null }>,
): Promise<AdminApiResponse<UserGroupDetail>> {
  return adminFetch<UserGroupDetail>(
    `/api/admin/permissions/groups/${groupId}/permissions`,
    {
      method: "PUT",
      body: JSON.stringify({ entries }),
    },
  );
}

export async function getPermissionCatalogApi(): Promise<
  AdminApiResponse<PermissionCatalogItem[]>
> {
  return adminFetch<PermissionCatalogItem[]>("/api/admin/permissions/catalog");
}

export async function getUserRightsApi(
  userId: string,
): Promise<AdminApiResponse<UserRightsOverview>> {
  return adminFetch<UserRightsOverview>(`/api/admin/permissions/users/${userId}`);
}

export async function checkUserPermissionApi(
  userId: string,
  permissionKey: string,
): Promise<AdminApiResponse<PermissionCheckResult>> {
  return adminFetch<PermissionCheckResult>(
    `/api/admin/permissions/users/${userId}/check`,
    {
      method: "POST",
      body: JSON.stringify({ permissionKey }),
    },
  );
}

export async function listPermissionAuditApi(): Promise<
  AdminApiResponse<PermissionAuditEntry[]>
> {
  return adminFetch<PermissionAuditEntry[]>("/api/admin/permissions/audit");
}

export async function seedPermissionSystemApi(): Promise<
  AdminApiResponse<{ permissions: number; groups: number }>
> {
  return adminFetch<{ permissions: number; groups: number }>(
    "/api/admin/permissions/seed",
    { method: "POST" },
  );
}

export async function addUsersToGroupApi(
  groupId: string,
  userIds: string[],
): Promise<AdminApiResponse<{ added: number }>> {
  return adminFetch<{ added: number }>(
    `/api/admin/permissions/groups/${groupId}/members`,
    {
      method: "POST",
      body: JSON.stringify({ userIds }),
    },
  );
}

export async function assignUserToGroupApi(
  userId: string,
  groupId: string,
  validUntil?: string | null,
): Promise<AdminApiResponse<{ added: number }>> {
  return adminFetch<{ added: number }>(
    `/api/admin/permissions/users/${userId}/groups`,
    {
      method: "POST",
      body: JSON.stringify({ groupId, validUntil }),
    },
  );
}

export async function removeUserFromGroupApi(
  userId: string,
  groupId: string,
): Promise<AdminApiResponse<{ removed: boolean }>> {
  return adminFetch<{ removed: boolean }>(
    `/api/admin/permissions/users/${userId}/groups`,
    {
      method: "DELETE",
      body: JSON.stringify({ groupId }),
    },
  );
}

export async function assignUserPermissionApi(
  userId: string,
  permissionKey: string,
  effect: PermissionEffect,
  validUntil?: string | null,
): Promise<AdminApiResponse<{ saved: boolean }>> {
  return adminFetch<{ saved: boolean }>(
    `/api/admin/permissions/users/${userId}/permissions`,
    {
      method: "POST",
      body: JSON.stringify({ permissionKey, effect, validUntil }),
    },
  );
}

export async function removeUserPermissionApi(
  userId: string,
  permissionKey: string,
): Promise<AdminApiResponse<{ removed: boolean }>> {
  return adminFetch<{ removed: boolean }>(
    `/api/admin/permissions/users/${userId}/permissions`,
    {
      method: "DELETE",
      body: JSON.stringify({ permissionKey }),
    },
  );
}
