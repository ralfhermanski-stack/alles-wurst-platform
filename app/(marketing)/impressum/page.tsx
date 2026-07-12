import type { Metadata } from "next";

import {
  buildLegalPageMetadata,
  renderLegalDocumentPage,
} from "@/lib/legal/legal-public-page";

export async function generateMetadata(): Promise<Metadata> {
  return buildLegalPageMetadata("impressum", {
    title: "Impressum",
    description: "Impressum der Alles-Wurst Plattform.",
  });
}

export default async function ImpressumPage() {
  return renderLegalDocumentPage({
    slug: "impressum",
    fallbackTitle: "Impressum",
    fallbackDescription: "Impressum der Alles-Wurst Plattform.",
  });
}
