import type { Metadata } from "next";

import {
  buildLegalPageMetadata,
  renderLegalDocumentPage,
} from "@/lib/legal/legal-public-page";

export async function generateMetadata(): Promise<Metadata> {
  return buildLegalPageMetadata("agb", {
    title: "AGB",
    description: "Allgemeine Geschäftsbedingungen der Alles-Wurst Plattform.",
  });
}

export default async function AgbPage() {
  return renderLegalDocumentPage({
    slug: "agb",
    fallbackTitle: "AGB",
    fallbackDescription: "Allgemeine Geschäftsbedingungen.",
  });
}
