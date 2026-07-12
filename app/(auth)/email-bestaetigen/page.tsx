import type { Metadata } from "next";
import { Suspense } from "react";

import EmailVerificationPanel from "@/components/auth/EmailVerificationPanel";

export const metadata: Metadata = {
  title: "E-Mail bestätigen",
  description: "Bestätige deine E-Mail-Adresse für dein Alles-Wurst-Konto.",
};

export default function EmailBestaetigenPage() {
  return (
    <div className="rounded-2xl border border-aw-gold/25 bg-gradient-to-b from-aw-surface to-aw-bg p-6 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.5)] sm:p-8">
      <h1 className="font-display text-2xl font-bold text-aw-cream">
        E-Mail bestätigen
      </h1>
      <p className="mt-2 text-sm text-aw-muted">
        Öffne den Link aus deiner E-Mail oder fordere einen neuen Bestätigungslink an.
      </p>

      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-aw-muted">Wird geladen …</p>}>
          <EmailVerificationPanel />
        </Suspense>
      </div>
    </div>
  );
}
