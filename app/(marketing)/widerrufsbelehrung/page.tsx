import type { Metadata } from "next";

import {
  buildLegalPageMetadata,
  renderLegalDocumentPage,
} from "@/lib/legal/legal-public-page";

export async function generateMetadata(): Promise<Metadata> {
  return buildLegalPageMetadata("widerrufsbelehrung", {
    title: "Widerrufsbelehrung",
    description: "Widerrufsbelehrung der Alles-Wurst Plattform.",
  });
}

export default async function WiderrufsbelehrungPage() {
  return renderLegalDocumentPage({
    slug: "widerrufsbelehrung",
    fallbackTitle: "Widerrufsbelehrung",
    fallbackDescription: "Widerrufsbelehrung.",
  });
}
