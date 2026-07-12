import type { Metadata } from "next";

import MeinBereichContent from "@/components/member/MeinBereichContent";

export const metadata: Metadata = {
  title: "Mein Bereich",
  description: "Persönliches Dashboard mit Kursfortschritt, Rezepten und Zertifikaten.",
};

export default function MeinBereichPage() {
  return <MeinBereichContent />;
}
