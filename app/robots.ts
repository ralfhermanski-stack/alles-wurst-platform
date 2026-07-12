import type { MetadataRoute } from "next";

import { getBlogSiteUrl } from "@/lib/blog/blog-seo";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBlogSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/mein-bereich/", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
