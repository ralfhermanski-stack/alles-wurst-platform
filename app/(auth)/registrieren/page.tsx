import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

export const metadata: Metadata = {
  title: "Registrieren",
  description:
    "Registrierung bei Alles Wurst ist derzeit nur mit persönlicher Einladung möglich.",
};

export default async function RegistrierenPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim();

  if (token) {
    redirect(`/einladung?token=${encodeURIComponent(token)}`);
  }

  return (
    <div className="rounded-2xl border border-aw-gold/25 bg-gradient-to-b from-aw-surface to-aw-bg p-6 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.5)] sm:p-8">
      <h1 className="font-display text-2xl font-bold text-aw-cream">
        Registrierung nur mit Einladung
      </h1>
      <p className="mt-3 text-sm text-aw-muted">
        Neue Konten können derzeit nur über einen persönlichen Einladungslink
        erstellt werden. Wenn du eine Einladung erhalten hast, öffne den Link
        aus der E-Mail — dort kannst du dich registrieren.
      </p>
      <p className="mt-3 text-sm text-aw-muted">
        Hast du bereits ein Konto? Dann melde dich einfach an.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/anmelden" className={`${primaryButtonClassName} text-center`}>
          Zur Anmeldung
        </Link>
        <Link href="/mitgliedschaft" className={`${secondaryButtonClassName} text-center`}>
          Mehr zur Mitgliedschaft
        </Link>
      </div>
    </div>
  );
}
