import type { BlogPostDetail } from "@/lib/blog/blog-types";
import { buildBlogPostingJsonLd } from "@/lib/blog/blog-seo";
import { isValidSchemaJson } from "@/lib/blog/blog-seo-ai-service";

export default function BlogStructuredData({ post }: { post: BlogPostDetail }) {
  const jsonLd =
    post.schemaJson && isValidSchemaJson(post.schemaJson)
      ? post.schemaJson
      : buildBlogPostingJsonLd(post);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
