import { redirect } from "next/navigation";

import PrivacyCenterPanel from "@/components/account/PrivacyCenterPanel";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";

export default async function AccountDatenschutzPage() {
  const userId = await getSessionUserIdFromCookies();

  if (!userId) {
    redirect("/anmelden?next=/account/datenschutz");
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-aw-cream">Datenschutz</h1>
      <p className="mt-2 text-sm text-aw-muted">
        Dein Datenschutz-Center: Daten einsehen, exportieren und Löschanträge stellen.
      </p>
      <div className="mt-8">
        <PrivacyCenterPanel />
      </div>
    </section>
  );
}
