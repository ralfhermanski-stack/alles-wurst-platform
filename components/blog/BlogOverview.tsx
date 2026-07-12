import Link from "next/link";

import BlogArticleCard from "@/components/blog/BlogArticleCard";
import PageHeader from "@/components/marketing/PageHeader";
import { listBlogCategories } from "@/lib/blog/blog-admin-service";
import { listPublicBlogPosts, getPopularBlogPosts } from "@/lib/blog/blog-service";
import type { BlogPostSummary } from "@/lib/blog/blog-types";

type BlogOverviewProps = {
  posts: BlogPostSummary[];
  popularPosts: BlogPostSummary[];
  categories: Awaited<ReturnType<typeof listBlogCategories>>;
  title?: string;
  description?: string;
};

export default function BlogOverview({
  posts,
  popularPosts,
  categories,
  title = "Magazin",
  description = "Wissen rund um Wurst, Räuchern, Fleischkunde und die Alles-Wurst-Akademie — verständlich erklärt von Ralf Hermanski, Fleischermeister.",
}: BlogOverviewProps) {
  return (
    <>
      <PageHeader eyebrow="Alles-Wurst Magazin" title={title} description={description} />

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="flex flex-wrap gap-2">
          <Link href="/magazin" className="rounded-full border border-aw-border px-3 py-1 text-sm text-aw-cream hover:border-aw-gold/50">
            Alle Artikel
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/magazin/kategorie/${category.slug}`}
              className="rounded-full border border-aw-border px-3 py-1 text-sm text-aw-muted hover:border-aw-gold/50 hover:text-aw-cream"
            >
              {category.name}
            </Link>
          ))}
          <Link href="/magazin/suche" className="rounded-full border border-aw-gold/40 px-3 py-1 text-sm text-aw-gold">
            Suche
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((post) => (
            <BlogArticleCard key={post.id} post={post} />
          ))}
        </div>
      </section>

      {popularPosts.length > 0 && (
        <section className="border-t border-aw-border bg-aw-surface/20 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-2xl font-bold text-aw-cream">Beliebte Artikel</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {popularPosts.map((post) => (
                <BlogArticleCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

export async function getBlogOverviewData(filters?: Parameters<typeof listPublicBlogPosts>[0]) {
  const [listResult, popularPosts, categories] = await Promise.all([
    listPublicBlogPosts(filters),
    getPopularBlogPosts(3),
    listBlogCategories(true),
  ]);

  return {
    posts: listResult.posts,
    total: listResult.total,
    popularPosts,
    categories,
  };
}
