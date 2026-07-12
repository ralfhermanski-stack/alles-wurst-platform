import type { Metadata } from "next";

import BlogOverview, { getBlogOverviewData } from "@/components/blog/BlogOverview";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/magazin", {
    title: "Magazin",
    description:
      "Wissen rund um Wurst selber machen, Räuchern, Fleischkunde und Hygiene — vom Fleischermeister erklärt.",
    openGraph: {
      type: "website",
      locale: "de_DE",
      title: "Alles-Wurst Magazin",
      description:
        "Fachartikel, Anleitungen und Tipps für Wurstliebhaber und Einsteiger.",
    },
  });
}

export default async function MagazinPage() {
  const data = await getBlogOverviewData({ limit: 12 });

  return (
    <BlogOverview
      posts={data.posts}
      popularPosts={data.popularPosts}
      categories={data.categories}
    />
  );
}
