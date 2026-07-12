import AdminCoursePreview from "@/components/admin/courses/AdminCoursePreview";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminCoursePreviewPage({ params }: PageProps) {
  const { id } = await params;

  return <AdminCoursePreview courseId={id} />;
}
