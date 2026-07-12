import type { Metadata } from "next";
import { Suspense } from "react";

import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Passwort zurücksetzen",
  description: "Setze ein neues Passwort für dein Alles-Wurst-Konto.",
};

export default function PasswortZuruecksetzenPage() {
  return (
    <div className="rounded-2xl border border-aw-gold/25 bg-gradient-to-b from-aw-surface to-aw-bg p-6 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.5)] sm:p-8">
      <h1 className="font-display text-2xl font-bold text-aw-cream">
        Neues Passwort setzen
      </h1>
      <p className="mt-2 text-sm text-aw-muted">
        Wähle ein neues Passwort mit mindestens 8 Zeichen.
      </p>

      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-aw-muted">Wird geladen …</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
