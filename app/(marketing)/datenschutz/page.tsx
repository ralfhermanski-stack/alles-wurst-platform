import type { Metadata } from "next";

import {
  buildLegalPageMetadata,
  renderLegalDocumentPage,
} from "@/lib/legal/legal-public-page";

export async function generateMetadata(): Promise<Metadata> {
  return buildLegalPageMetadata("datenschutz", {
    title: "Datenschutzerklärung",
    description: "Datenschutzerklärung der Alles-Wurst Plattform.",
  });
}

export default async function DatenschutzPage() {
  return renderLegalDocumentPage({
    slug: "datenschutz",
    fallbackTitle: "Datenschutzerklärung",
    fallbackDescription: "Datenschutzerklärung der Alles-Wurst Plattform.",
  });
}
