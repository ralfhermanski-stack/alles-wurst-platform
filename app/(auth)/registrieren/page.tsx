import type { Metadata } from "next";

import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Registrieren",
  description:
    "Kostenloses Alles-Wurst-Konto erstellen — mit vollständiger Adresse und Rezept-Verknüpfung.",
};

export default function RegistrierenPage() {
  return (
    <div className="rounded-2xl border border-aw-gold/25 bg-gradient-to-b from-aw-surface to-aw-bg p-6 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.5)] sm:p-8">
      <h1 className="font-display text-2xl font-bold text-aw-cream">
        Konto erstellen
      </h1>
      <p className="mt-2 text-sm text-aw-muted">
        Registriere dich kostenlos für den Rezeptgenerator und die Rezeptdatenbank.
      </p>

      <div className="mt-8">
        <RegisterForm />
      </div>
    </div>
  );
}
