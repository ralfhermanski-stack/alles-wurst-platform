/**
 * @file admin-course-client.ts
 * @purpose Client für Admin-Kurs-APIs.
 */

import { adminFetch } from "@/lib/admin/admin-fetch";

import type { AdminCourseRecord, CourseDetail } from "./course-types";
import type { MembershipCourseRuleEntry } from "./admin-course-service";

type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = {
  success: false;
  error: { code: string; message: string };
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

async function adminCourseRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  return adminFetch<T>(path, init);
}

export async function listAdminCoursesApi(): Promise<
  ApiResponse<import("./course-types").CourseSummary[]>
> {
  return adminCourseRequest("/api/admin/courses");
}

export async function getAdminCourseApi(
  courseId: string,
): Promise<ApiResponse<AdminCourseRecord | null>> {
  return adminCourseRequest(`/api/admin/courses/${courseId}`);
}

export async function createAdminCourseApi(
  body: Record<string, unknown>,
): Promise<ApiResponse<AdminCourseRecord>> {
  return adminCourseRequest("/api/admin/courses", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateAdminCourseApi(
  courseId: string,
  body: Record<string, unknown>,
): Promise<ApiResponse<AdminCourseRecord>> {
  return adminCourseRequest(`/api/admin/courses/${courseId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function createModuleApi(
  courseId: string,
  body: Record<string, unknown>,
): Promise<ApiResponse<CourseDetail>> {
  return adminCourseRequest(`/api/admin/courses/${courseId}/modules`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function createLessonApi(
  courseId: string,
  moduleId: string,
  body: Record<string, unknown>,
): Promise<ApiResponse<CourseDetail>> {
  return adminCourseRequest(
    `/api/admin/courses/${courseId}/modules/${moduleId}/lessons`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export async function updateLessonApi(
  courseId: string,
  moduleId: string,
  lessonId: string,
  body: Record<string, unknown>,
): Promise<ApiResponse<CourseDetail>> {
  return adminCourseRequest(
    `/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export async function updateModuleApi(
  courseId: string,
  moduleId: string,
  body: Record<string, unknown>,
): Promise<ApiResponse<CourseDetail>> {
  return adminCourseRequest(
    `/api/admin/courses/${courseId}/modules/${moduleId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export async function deleteModuleApi(
  courseId: string,
  moduleId: string,
): Promise<ApiResponse<CourseDetail>> {
  return adminCourseRequest(
    `/api/admin/courses/${courseId}/modules/${moduleId}`,
    { method: "DELETE" },
  );
}

export async function deleteLessonApi(
  courseId: string,
  moduleId: string,
  lessonId: string,
): Promise<ApiResponse<CourseDetail>> {
  return adminCourseRequest(
    `/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}`,
    { method: "DELETE" },
  );
}

export async function listMembershipRulesApi(): Promise<
  ApiResponse<MembershipCourseRuleEntry[]>
> {
  return adminCourseRequest("/api/admin/membership-course-rules");
}

export async function upsertMembershipRuleApi(
  body: Record<string, unknown>,
): Promise<ApiResponse<MembershipCourseRuleEntry>> {
  return adminCourseRequest("/api/admin/membership-course-rules", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function grantUserCourseAccessApi(
  userId: string,
  courseId: string,
  body: Record<string, unknown>,
): Promise<ApiResponse<unknown>> {
  return adminCourseRequest(`/api/admin/users/${userId}/course-access`, {
    method: "POST",
    body: JSON.stringify({ courseId, ...body }),
  });
}

export async function revokeUserCourseAccessApi(
  userId: string,
  courseId: string,
): Promise<ApiResponse<true>> {
  return adminCourseRequest(
    `/api/admin/users/${userId}/course-access/${courseId}`,
    { method: "DELETE" },
  );
}

export async function uploadLessonDownloadApi(
  courseId: string,
  moduleId: string,
  lessonId: string,
  formData: FormData,
): Promise<ApiResponse<CourseDetail>> {
  return adminCourseRequest<CourseDetail>(
    `/api/admin/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/upload`,
    {
      method: "POST",
      body: formData,
    },
  );
}

export async function uploadCourseCoverApi(
  courseId: string,
  formData: FormData,
): Promise<ApiResponse<AdminCourseRecord>> {
  return adminCourseRequest<AdminCourseRecord>(
    `/api/admin/courses/${courseId}/cover`,
    {
      method: "POST",
      body: formData,
    },
  );
}

export async function duplicateCourseApi(
  courseId: string,
): Promise<ApiResponse<AdminCourseRecord>> {
  return adminCourseRequest(`/api/admin/courses/${courseId}/duplicate`, {
    method: "POST",
  });
}

export async function publishCourseApi(
  courseId: string,
): Promise<ApiResponse<AdminCourseRecord>> {
  return adminCourseRequest(`/api/admin/courses/${courseId}/publish`, {
    method: "POST",
  });
}

export async function archiveCourseApi(
  courseId: string,
): Promise<ApiResponse<AdminCourseRecord>> {
  return adminCourseRequest(`/api/admin/courses/${courseId}/archive`, {
    method: "POST",
  });
}

export async function regenerateSalesProductApi(
  courseId: string,
): Promise<ApiResponse<AdminCourseRecord>> {
  return adminCourseRequest(`/api/admin/courses/${courseId}/sales-product`, {
    method: "POST",
  });
}

export async function getCourseValidationApi(
  courseId: string,
): Promise<
  ApiResponse<import("./course-validation").CourseValidationIssue[]>
> {
  return adminCourseRequest(`/api/admin/courses/${courseId}/validation`);
}

export async function reorderModulesApi(
  courseId: string,
  moduleIds: string[],
): Promise<ApiResponse<CourseDetail>> {
  return adminCourseRequest(`/api/admin/courses/${courseId}/modules/reorder`, {
    method: "PUT",
    body: JSON.stringify({ moduleIds }),
  });
}

export async function reorderLessonsApi(
  courseId: string,
  moduleId: string,
  lessonIds: string[],
): Promise<ApiResponse<CourseDetail>> {
  return adminCourseRequest(
    `/api/admin/courses/${courseId}/modules/${moduleId}/lessons/reorder`,
    {
      method: "PUT",
      body: JSON.stringify({ lessonIds }),
    },
  );
}

export async function importCourseApi(
  payload: Record<string, unknown>,
): Promise<ApiResponse<AdminCourseRecord>> {
  return adminCourseRequest("/api/admin/courses/import", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
