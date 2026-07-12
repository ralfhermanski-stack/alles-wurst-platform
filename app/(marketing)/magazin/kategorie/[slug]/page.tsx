import type { Metadata } from "next";
import { notFound } from "next/navigation";

import BlogOverview, { getBlogOverviewData } from "@/components/blog/BlogOverview";
import { prisma } from "@/lib/db/prisma";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.blogCategory.findFirst({
    where: { slug, isActive: true },
  });

  if (!category) {
    return { title: "Kategorie nicht gefunden" };
  }

  return {
    title: `${category.name} — Magazin`,
    description: category.description ?? `Artikel zum Thema ${category.name}.`,
  };
}

export default async function MagazinCategoryPage({ params }: PageProps) {
  const { slug } = await params;

  const category = await prisma.blogCategory.findFirst({
    where: { slug, isActive: true },
  });

  if (!category) {
    notFound();
  }

  const data = await getBlogOverviewData({ categorySlug: slug, limit: 24 });

  return (
    <BlogOverview
      posts={data.posts}
      popularPosts={data.popularPosts}
      categories={data.categories}
      title={category.name}
      description={category.description ?? `Alle Artikel in der Rubrik ${category.name}.`}
    />
  );
}
