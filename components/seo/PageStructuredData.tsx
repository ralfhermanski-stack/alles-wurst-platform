import type { PageSeoRecord } from "@/lib/page-seo/page-seo-types";

type PageStructuredDataProps = {
  seo: PageSeoRecord | null;
};

export default function PageStructuredData({ seo }: PageStructuredDataProps) {
  if (!seo?.jsonLd) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(seo.jsonLd) }}
    />
  );
}
