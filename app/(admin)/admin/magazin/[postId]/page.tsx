import AdminBlogEditor from "@/components/admin/blog/AdminBlogEditor";

type PageProps = {
  params: Promise<{ postId: string }>;
};

export const metadata = {
  title: "Artikel bearbeiten",
};

export default async function AdminMagazinEditPage({ params }: PageProps) {
  const { postId } = await params;
  return <AdminBlogEditor postId={postId} />;
}
