import type { Metadata } from "next";
import { notFound } from "next/navigation";

import LegalDocumentPageView from "@/components/legal/LegalDocumentPageView";
import PageHeader from "@/components/marketing/PageHeader";
import {
  ensureDefaultLegalDocuments,
  getPublishedLegalDocumentBySlug,
} from "@/lib/legal/legal-document-service";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

type LegalSlugPageProps = {
  slug: string;
  eyebrow?: string;
  fallbackTitle: string;
  fallbackDescription: string;
};

export async function buildLegalPageMetadata(
  slug: string,
  fallback: { title: string; description: string },
): Promise<Metadata> {
  await ensureDefaultLegalDocuments();
  const document = await getPublishedLegalDocumentBySlug(slug);

  return buildStaticPageMetadata(`/${slug}`, {
    title: document?.title ?? fallback.title,
    description: fallback.description,
    robots: document?.seoIndex === false ? { index: false } : undefined,
  });
}

export async function renderLegalDocumentPage({
  slug,
  eyebrow = "Rechtliches",
  fallbackTitle,
}: LegalSlugPageProps) {
  await ensureDefaultLegalDocuments();
  const document = await getPublishedLegalDocumentBySlug(slug);

  if (!document) {
    notFound();
  }

  return (
    <>
      <PageHeader eyebrow={eyebrow} title={document.title} />
      <LegalDocumentPageView document={document} />
    </>
  );
}
