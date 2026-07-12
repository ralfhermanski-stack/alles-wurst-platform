import type { Metadata } from "next";
import { notFound } from "next/navigation";

import BlogArticlePage from "@/components/blog/BlogArticlePage";
import { buildBlogMetadata } from "@/lib/blog/blog-seo";
import { getBlogPreviewPost, getPublicBlogPostBySlug } from "@/lib/blog/blog-service";

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ preview?: string }>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { preview } = await searchParams;

  const post = preview
    ? await getBlogPreviewPost(preview, preview)
    : await getPublicBlogPostBySlug(slug);

  if (!post) {
    return { title: "Artikel nicht gefunden" };
  }

  return buildBlogMetadata(post);
}

export default async function MagazinArticlePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { preview } = await searchParams;

  const post = preview
    ? await getBlogPreviewPost(preview, preview)
    : await getPublicBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return <BlogArticlePage post={post} />;
}
