import type { Metadata } from "next";

import {
  buildLegalPageMetadata,
  renderLegalDocumentPage,
} from "@/lib/legal/legal-public-page";

export async function generateMetadata(): Promise<Metadata> {
  return buildLegalPageMetadata("forenregeln", {
    title: "Forenregeln",
    description:
      "Regeln für den respektvollen Umgang in den Foren der Alles-Wurst Plattform.",
  });
}

export default async function ForenregelnPage() {
  return renderLegalDocumentPage({
    slug: "forenregeln",
    fallbackTitle: "Forenregeln",
    fallbackDescription: "Regeln für den respektvollen Umgang in unseren Foren.",
  });
}
