import AdminPageEditorShell from "@/components/admin/page-editor/AdminPageEditorShell";

type PageProps = {
  params: Promise<{ pageId: string }>;
};

export default async function AdminSeiteneditorEditPage({ params }: PageProps) {
  const { pageId } = await params;
  return <AdminPageEditorShell pageId={pageId} />;
}
