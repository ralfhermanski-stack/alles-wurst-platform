import Link from "next/link";

import type { BlogPostDetail } from "@/lib/blog/blog-types";

export default function BlogAuthorBox({ post }: { post: BlogPostDetail }) {
  return (
    <aside className="rounded-xl border border-aw-border bg-aw-surface/50 p-5">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-aw-gold">Autor</p>
      <p className="mt-2 font-display text-lg font-bold text-aw-cream">{post.authorDisplayName}</p>
      {post.reviewedByName && (
        <p className="mt-1 text-sm text-aw-muted">Geprüft von {post.reviewedByName}</p>
      )}
      {post.expertNote && (
        <p className="mt-3 text-sm leading-6 text-aw-cream/90">{post.expertNote}</p>
      )}
      <Link href="/akademie" className="mt-4 inline-block text-sm font-semibold text-aw-gold hover:text-aw-cream">
        Zur Akademie →
      </Link>
    </aside>
  );
}
