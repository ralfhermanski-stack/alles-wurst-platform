import type { Metadata } from "next";

import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Passwort vergessen",
  description: "Fordere einen Link zum Zurücksetzen deines Passworts an.",
};

export default function PasswortVergessenPage() {
  return (
    <div className="rounded-2xl border border-aw-gold/25 bg-gradient-to-b from-aw-surface to-aw-bg p-6 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.5)] sm:p-8">
      <h1 className="font-display text-2xl font-bold text-aw-cream">
        Passwort vergessen
      </h1>
      <p className="mt-2 text-sm text-aw-muted">
        Wir senden dir einen Link zum Zurücksetzen deines Passworts an deine E-Mail-Adresse.
      </p>

      <div className="mt-8">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
