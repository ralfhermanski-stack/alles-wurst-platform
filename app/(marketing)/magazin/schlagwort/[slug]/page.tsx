import type { Metadata } from "next";
import { notFound } from "next/navigation";

import BlogOverview, { getBlogOverviewData } from "@/components/blog/BlogOverview";
import { prisma } from "@/lib/db/prisma";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await prisma.blogTag.findUnique({ where: { slug } });

  if (!tag) {
    return { title: "Schlagwort nicht gefunden" };
  }

  return {
    title: `${tag.name} — Magazin`,
    description: `Artikel zum Schlagwort ${tag.name}.`,
  };
}

export default async function MagazinTagPage({ params }: PageProps) {
  const { slug } = await params;

  const tag = await prisma.blogTag.findUnique({ where: { slug } });

  if (!tag) {
    notFound();
  }

  const data = await getBlogOverviewData({ tagSlug: slug, limit: 24 });

  return (
    <BlogOverview
      posts={data.posts}
      popularPosts={data.popularPosts}
      categories={data.categories}
      title={`Schlagwort: ${tag.name}`}
      description={`Alle Artikel mit dem Schlagwort ${tag.name}.`}
    />
  );
}
