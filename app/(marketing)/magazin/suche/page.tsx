import BlogOverview, { getBlogOverviewData } from "@/components/blog/BlogOverview";

type PageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function MagazinSearchPage({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";

  const data = await getBlogOverviewData({
    query: query || undefined,
    limit: 24,
  });

  return (
    <BlogOverview
      posts={data.posts}
      popularPosts={data.popularPosts}
      categories={data.categories}
      title={query ? `Suche: ${query}` : "Magazin durchsuchen"}
      description={
        query
          ? `${data.total} Treffer für „${query}“.`
          : "Durchsuche alle Magazin-Artikel nach Themen, Keywords und Inhalten."
      }
    />
  );
}
