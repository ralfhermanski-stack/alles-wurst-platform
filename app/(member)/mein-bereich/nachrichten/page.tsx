import { redirect } from "next/navigation";

import AccountMessagesPanel from "@/components/member/AccountMessagesPanel";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";

export default async function MeinBereichNachrichtenPage() {
  const userId = await getSessionUserIdFromCookies();

  if (!userId) {
    redirect("/anmelden?next=/mein-bereich/nachrichten");
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-aw-cream">Nachrichten</h1>
      <p className="mt-2 text-sm text-aw-muted">
        Mitteilungen zu Widerrufen, Datenexporten, Löschanträgen und anderen
        Konto-Vorgängen.
      </p>
      <div className="mt-8">
        <AccountMessagesPanel />
      </div>
    </section>
  );
}
