import type { Metadata } from "next";
import { Suspense } from "react";

import LoginForm from "@/components/auth/LoginForm";
import { getPlatformText } from "@/lib/platform-text/platform-text-service";

export async function generateMetadata(): Promise<Metadata> {
  const title = await getPlatformText("auth.login.title", "Anmelden");

  return {
    title,
    description: await getPlatformText(
      "auth.login.subtitle",
      "Bei Alles Wurst anmelden und auf Rezepte, Kurse und Club-Inhalte zugreifen.",
    ),
  };
}

export default async function AnmeldenPage() {
  const [title, subtitle, loadingHint] = await Promise.all([
    getPlatformText("auth.login.title", "Anmelden"),
    getPlatformText(
      "auth.login.subtitle",
      "Melde dich mit deiner E-Mail an. Vorhandene Rezepte aus dem Rezeptgenerator werden automatisch verknüpft.",
    ),
    getPlatformText("auth.login.loading", "Formular wird geladen …"),
  ]);

  return (
    <div className="rounded-2xl border border-aw-gold/25 bg-gradient-to-b from-aw-surface to-aw-bg p-6 shadow-[0_24px_48px_-24px_rgba(0,0,0,0.5)] sm:p-8">
      <h1 className="font-display text-2xl font-bold text-aw-cream">{title}</h1>
      <p className="mt-2 text-sm text-aw-muted">{subtitle}</p>

      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-aw-muted">{loadingHint}</p>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
