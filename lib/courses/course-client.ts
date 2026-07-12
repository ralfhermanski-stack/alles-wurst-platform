/**
 * @file course-client.ts
 * @purpose Client für Nutzer-Kurs-APIs.
 */

import type {
  CourseDetail,
  CourseProgressSummary,
  LessonDetail,
  UserCourseEntry,
} from "./course-types";

type ApiSuccess<T> = { success: true; data: T };
type ApiFailure = {
  success: false;
  error: { code: string; message: string };
};

type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

async function courseRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    credentials: "include",
  });

  return response.json() as Promise<ApiResponse<T>>;
}

export async function fetchMyCoursesApi(): Promise<ApiResponse<UserCourseEntry[]>> {
  return courseRequest<UserCourseEntry[]>("/api/courses/my");
}

export async function fetchCourseBySlugApi(
  slug: string,
): Promise<ApiResponse<CourseDetail | null>> {
  return courseRequest<CourseDetail | null>(`/api/courses/${slug}`);
}

export async function fetchLessonApi(
  courseSlug: string,
  lessonSlug: string,
): Promise<ApiResponse<LessonDetail | null>> {
  return courseRequest<LessonDetail | null>(
    `/api/courses/${courseSlug}/lessons/${lessonSlug}`,
  );
}

export async function updateLessonProgressApi(
  courseSlug: string,
  lessonSlug: string,
  completed: boolean,
): Promise<ApiResponse<CourseProgressSummary>> {
  return courseRequest<CourseProgressSummary>(
    `/api/courses/${courseSlug}/lessons/${lessonSlug}/progress`,
    {
      method: "POST",
      body: JSON.stringify({ completed }),
    },
  );
}

export async function fetchPublishedCoursesApi(): Promise<
  ApiResponse<import("./course-types").CourseSummary[]>
> {
  return courseRequest<import("./course-types").CourseSummary[]>(
    "/api/courses/catalog",
  );
}
