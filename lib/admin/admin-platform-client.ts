/**
 * @file admin-platform-client.ts
 * @purpose Client für Admin-Plattform-APIs (Dashboard, Benutzer, …).
 */

import { adminFetch, type AdminApiResponse } from "./admin-fetch";
import type { AdminDashboardStats } from "./admin-dashboard-service";
import type { AdminMembershipEntry } from "./admin-membership-service";
import type { AdminOrderEntry } from "./admin-order-service";
import type {
  AdminUserDetail,
  AdminUserListEntry,
} from "./admin-user-service";
import type { CourseSummary } from "@/lib/courses/course-types";
import type { MembershipRole, UserAccountStatus, UserSystemRole } from "@prisma/client";

export async function fetchAdminDashboardStatsApi(): Promise<
  AdminApiResponse<AdminDashboardStats>
> {
  return adminFetch<AdminDashboardStats>("/api/admin/dashboard/stats");
}

export async function listAdminUsersApi(
  search?: string,
): Promise<AdminApiResponse<AdminUserListEntry[]>> {
  const query = search?.trim()
    ? `?q=${encodeURIComponent(search.trim())}`
    : "";

  return adminFetch<AdminUserListEntry[]>(`/api/admin/users${query}`);
}

export async function getAdminUserDetailApi(
  userId: string,
): Promise<AdminApiResponse<AdminUserDetail>> {
  return adminFetch<AdminUserDetail>(`/api/admin/users/${userId}`);
}

export async function updateAdminUserApi(
  userId: string,
  body: {
    accountStatus?: UserAccountStatus;
    systemRole?: UserSystemRole;
    note?: string | null;
  },
): Promise<AdminApiResponse<AdminUserListEntry>> {
  return adminFetch<AdminUserListEntry>(`/api/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/** @deprecated Nutze updateAdminUserApi */
export async function updateAdminUserRoleApi(
  userId: string,
  systemRole: UserSystemRole,
): Promise<AdminApiResponse<AdminUserListEntry>> {
  return updateAdminUserApi(userId, { systemRole });
}

export async function listAdminUserCoursesApi(
  userId: string,
): Promise<AdminApiResponse<CourseSummary[]>> {
  return adminFetch<CourseSummary[]>(`/api/admin/users/${userId}/courses`);
}

export async function grantAdminUserCourseApi(
  userId: string,
  body: {
    courseId: string;
    expiresAt?: string | null;
    note?: string | null;
  },
): Promise<AdminApiResponse<AdminUserListEntry>> {
  return adminFetch<AdminUserListEntry>(`/api/admin/users/${userId}/courses`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function revokeAdminUserCourseApi(
  userId: string,
  courseId: string,
  note?: string | null,
): Promise<AdminApiResponse<AdminUserListEntry>> {
  return adminFetch<AdminUserListEntry>(
    `/api/admin/users/${userId}/courses/${courseId}`,
    {
      method: "DELETE",
      body: JSON.stringify({ note: note ?? null }),
    },
  );
}

export async function assignAdminUserMembershipApi(
  userId: string,
  body: {
    role: MembershipRole;
    extendedUntil?: string | null;
    note?: string | null;
  },
): Promise<AdminApiResponse<AdminUserListEntry>> {
  return adminFetch<AdminUserListEntry>(
    `/api/admin/users/${userId}/memberships`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function endAdminUserMembershipApi(
  userId: string,
  membershipId: string,
  note?: string | null,
): Promise<AdminApiResponse<AdminUserListEntry>> {
  return adminFetch<AdminUserListEntry>(
    `/api/admin/users/${userId}/memberships/${membershipId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ note: note ?? null }),
    },
  );
}

export async function listAdminMembershipsApi(): Promise<
  AdminApiResponse<AdminMembershipEntry[]>
> {
  return adminFetch<AdminMembershipEntry[]>("/api/admin/memberships");
}

export async function listAdminOrdersApi(): Promise<
  AdminApiResponse<AdminOrderEntry[]>
> {
  return adminFetch<AdminOrderEntry[]>("/api/admin/orders");
}
