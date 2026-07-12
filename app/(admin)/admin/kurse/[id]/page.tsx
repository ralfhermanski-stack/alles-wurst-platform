import AdminCourseEditor from "@/components/admin/courses/AdminCourseEditor";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditCoursePage({ params }: PageProps) {
  const { id } = await params;

  return <AdminCourseEditor courseId={id} />;
}
