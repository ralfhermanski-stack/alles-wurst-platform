import type { Metadata } from "next";
import { Suspense } from "react";

import InviteLandingContent from "@/components/beta-test/InviteLandingContent";

export const metadata: Metadata = {
  title: "Betatest-Einladung",
  description: "Einladung zum geschlossenen Betatest von Alles Wurst.",
  robots: { index: false, follow: false },
};

export default function EinladungPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-aw-muted">Einladung wird geladen …</p>
      }
    >
      <InviteLandingContent />
    </Suspense>
  );
}
