import { listPublishedCourses } from "@/lib/courses/course-catalog-service";
import { jsonFromCourseResult } from "@/lib/courses/course-api-utils";

export async function GET(): Promise<Response> {
  const courses = await listPublishedCourses();

  return jsonFromCourseResult({ success: true, data: courses });
}
