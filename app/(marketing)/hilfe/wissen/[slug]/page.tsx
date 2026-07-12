import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import PageHeader from "@/components/marketing/PageHeader";
import HelpCommunityForums from "@/components/help/HelpCommunityForums";
import { getPublishedKnowledgeBaseArticle } from "@/lib/knowledge-base/knowledge-base-service";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";
import { getPlatformText } from "@/lib/platform-text/platform-text-service";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const userId = await getSessionUserIdFromCookies();
  const article = await getPublishedKnowledgeBaseArticle(slug, userId, {
    recordView: false,
  });

  if (!article) {
    return { title: "Artikel nicht gefunden" };
  }

  return buildStaticPageMetadata(`/hilfe/wissen/${slug}`, {
    title: article.title,
    description: article.summary ?? article.title,
  });
}

export default async function KnowledgeArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const userId = await getSessionUserIdFromCookies();
  const [article, askCommunityLabel, createTicketLabel] = await Promise.all([
    getPublishedKnowledgeBaseArticle(slug, userId, { recordView: true }),
    getPlatformText("help.askCommunity", "Zum Forum"),
    getPlatformText("help.createTicket", "Support-Ticket erstellen"),
  ]);

  if (!article) {
    notFound();
  }

  return (
    <>
      <PageHeader
        eyebrow={article.categoryName}
        title={article.title}
        description={article.summary ?? undefined}
      />

      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="whitespace-pre-wrap text-sm leading-7 text-aw-cream/90">
          {article.content}
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <HelpCommunityForums askCommunityLabel={askCommunityLabel} compact />

          <div className="rounded-2xl border border-aw-border bg-aw-surface/40 p-5">
            <h2 className="font-display text-lg font-bold text-aw-cream">
              Noch Fragen?
            </h2>
            <Link
              href={`/account/tickets/new?fromFaq=1&faqSlug=${encodeURIComponent(slug)}`}
              className="mt-3 inline-flex text-sm font-semibold text-aw-gold hover:text-aw-cream"
            >
              {createTicketLabel} →
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
