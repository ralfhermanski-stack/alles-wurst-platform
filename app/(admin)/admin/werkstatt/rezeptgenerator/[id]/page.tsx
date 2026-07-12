import AdminRecipeDetail from "@/components/admin/recipe-generator/AdminRecipeDetail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminRecipeDetailPage({ params }: PageProps) {
  const { id } = await params;

  return <AdminRecipeDetail recipeId={id} />;
}
