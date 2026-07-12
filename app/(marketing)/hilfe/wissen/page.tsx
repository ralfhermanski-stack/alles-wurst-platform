import type { Metadata } from "next";

import KnowledgeBaseBrowser from "@/components/help/KnowledgeBaseBrowser";
import HelpCommunityForums from "@/components/help/HelpCommunityForums";
import PageHeader from "@/components/marketing/PageHeader";
import PlatformText from "@/components/platform-text/PlatformText";
import {
  listKnowledgeBaseCategories,
  searchPublishedKnowledgeBaseArticles,
} from "@/lib/knowledge-base/knowledge-base-service";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";
import { getPlatformText } from "@/lib/platform-text/platform-text-service";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/hilfe/wissen", {
    title: "Wissensdatenbank",
    description: "Häufige Fragen und Anleitungen rund um Alles Wurst.",
  });
}

export default async function WissensdatenbankPage() {
  const userId = await getSessionUserIdFromCookies();
  const [categories, initialResult, searchPlaceholder, noResultsTitle, noResultsDescription, createTicketLabel, askCommunityLabel] =
    await Promise.all([
      listKnowledgeBaseCategories(),
      searchPublishedKnowledgeBaseArticles("", { userId, logSearch: false }),
      getPlatformText("help.search.placeholder", "Wonach suchst du?"),
      getPlatformText("help.noResults.title", "Keine passende Antwort gefunden?"),
      getPlatformText(
        "help.noResults.description",
        "Wir helfen dir gerne persönlich weiter.",
      ),
      getPlatformText("help.createTicket", "Support-Ticket erstellen"),
      getPlatformText("help.askCommunity", "Zum Forum"),
    ]);

  return (
    <>
      <PageHeader
        eyebrow="Hilfe"
        title={
          <PlatformText
            textKey="help.knowledge.title"
            elementType="heading"
            as="span"
            fallback="Wissensdatenbank"
          />
        }
        description="Häufige Fragen beantworten, bevor ein Ticket erstellt wird."
      />

      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <KnowledgeBaseBrowser
          initialArticles={initialResult.articles}
          categories={categories}
          searchPlaceholder={searchPlaceholder}
          noResultsTitle={noResultsTitle}
          noResultsDescription={noResultsDescription}
          createTicketLabel={createTicketLabel}
        />

        <div className="mt-12">
          <HelpCommunityForums askCommunityLabel={askCommunityLabel} />
        </div>
      </section>
    </>
  );
}
