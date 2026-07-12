import type { Metadata } from "next";

import HelpHubCards from "@/components/help/HelpHubCards";
import PageHeader from "@/components/marketing/PageHeader";
import PlatformText from "@/components/platform-text/PlatformText";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/hilfe", {
    title: "Hilfe & Unterstützung",
    description:
      "Finde schnell Antworten, stelle Fragen oder kontaktiere den Support.",
  });
}

export default function HilfePage() {
  return (
    <>
      <PageHeader
        eyebrow="Hilfe"
        title={
          <PlatformText
            textKey="help.title"
            elementType="heading"
            as="span"
            fallback="Hilfe & Unterstützung"
          />
        }
        description={
          <PlatformText
            textKey="help.subtitle"
            elementType="text"
            as="span"
            fallback="Finde schnell Antworten, stelle Fragen oder kontaktiere den Support."
          />
        }
      />

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <HelpHubCards />
      </section>
    </>
  );
}
