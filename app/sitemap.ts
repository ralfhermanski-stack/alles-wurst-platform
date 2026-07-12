import type { MetadataRoute } from "next";

import { listBlogPostsForSitemap } from "@/lib/blog/blog-admin-service";
import { getBlogSiteUrl } from "@/lib/blog/blog-seo";
import { listBlogCategories } from "@/lib/blog/blog-admin-service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBlogSiteUrl();

  const [posts, categories] = await Promise.all([
    listBlogPostsForSitemap(),
    listBlogCategories(true),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/magazin`,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/magazin/suche`,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${baseUrl}/magazin/${post.slug}`,
    lastModified: post.contentUpdatedAt ?? post.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${baseUrl}/magazin/kategorie/${category.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticEntries, ...categoryEntries, ...postEntries];
}
