import Link from "next/link";
import { redirect } from "next/navigation";

import CommunityOverview from "@/components/community/CommunityOverview";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";
import { getCommunityOverview } from "@/lib/forums/forum-community-service";

export default async function MemberForumsPage() {
  const userId = await getSessionUserIdFromCookies();

  if (!userId) {
    redirect("/anmelden");
  }

  const { forums, activity } = await getCommunityOverview(userId);

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <Link
          href="/mein-bereich"
          className="text-sm text-aw-gold hover:underline"
        >
          ← Zurück zu Mein Bereich
        </Link>
        <h1 className="mt-4 font-display text-3xl font-bold text-aw-cream">
          Foren
        </h1>
        <p className="mt-2 text-sm text-aw-muted">
          Tausche dich mit der Community aus. Vor dem ersten Beitrag musst du
          die{" "}
          <Link href="/forenregeln" className="text-aw-gold underline">
            Forenregeln
          </Link>{" "}
          akzeptieren.
        </p>
      </div>

      <CommunityOverview forums={forums} activity={activity} />
    </section>
  );
}
