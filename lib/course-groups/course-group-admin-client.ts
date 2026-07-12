/**
 * @file course-group-admin-client.ts
 * @purpose Client für Admin-APIs zu Kursgruppen.
 */

import { adminFetch } from "@/lib/admin/admin-fetch";
import type {
  CourseGroupRecord,
  CourseSubgroupRecord,
} from "@/lib/course-groups/course-group-types";

type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = {
  success: false;
  error: { code: string; message: string };
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

async function adminGroupRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  return adminFetch<T>(path, init);
}

export async function listCourseGroupsApi(options?: {
  activeOnly?: boolean;
}): Promise<ApiResponse<CourseGroupRecord[]>> {
  const params = new URLSearchParams();

  if (options?.activeOnly) {
    params.set("activeOnly", "true");
  }

  const query = params.toString();

  return adminGroupRequest(
    `/api/admin/course-groups${query ? `?${query}` : ""}`,
  );
}

export async function createCourseGroupApi(
  body: Record<string, unknown>,
): Promise<ApiResponse<CourseGroupRecord>> {
  return adminGroupRequest("/api/admin/course-groups", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateCourseGroupApi(
  groupId: string,
  body: Record<string, unknown>,
): Promise<ApiResponse<CourseGroupRecord>> {
  return adminGroupRequest(`/api/admin/course-groups/${groupId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteCourseGroupApi(
  groupId: string,
): Promise<ApiResponse<true>> {
  return adminGroupRequest(`/api/admin/course-groups/${groupId}`, {
    method: "DELETE",
  });
}

export async function uploadCourseGroupImageApi(
  groupId: string,
  formData: FormData,
): Promise<ApiResponse<CourseGroupRecord>> {
  return adminGroupRequest<CourseGroupRecord>(
    `/api/admin/course-groups/${groupId}/image`,
    {
      method: "POST",
      body: formData,
    },
  );
}

export async function listCourseSubgroupsApi(options?: {
  courseGroupId?: string;
  activeOnly?: boolean;
}): Promise<ApiResponse<CourseSubgroupRecord[]>> {
  const params = new URLSearchParams();

  if (options?.courseGroupId) {
    params.set("courseGroupId", options.courseGroupId);
  }

  if (options?.activeOnly) {
    params.set("activeOnly", "true");
  }

  const query = params.toString();

  return adminGroupRequest(
    `/api/admin/course-subgroups${query ? `?${query}` : ""}`,
  );
}

export async function createCourseSubgroupApi(
  body: Record<string, unknown>,
): Promise<ApiResponse<CourseSubgroupRecord>> {
  return adminGroupRequest("/api/admin/course-subgroups", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateCourseSubgroupApi(
  subgroupId: string,
  body: Record<string, unknown>,
): Promise<ApiResponse<CourseSubgroupRecord>> {
  return adminGroupRequest(`/api/admin/course-subgroups/${subgroupId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function deleteCourseSubgroupApi(
  subgroupId: string,
): Promise<ApiResponse<true>> {
  return adminGroupRequest(`/api/admin/course-subgroups/${subgroupId}`, {
    method: "DELETE",
  });
}

export async function uploadCourseSubgroupImageApi(
  subgroupId: string,
  formData: FormData,
): Promise<ApiResponse<CourseSubgroupRecord>> {
  return adminGroupRequest<CourseSubgroupRecord>(
    `/api/admin/course-subgroups/${subgroupId}/image`,
    {
      method: "POST",
      body: formData,
    },
  );
}
