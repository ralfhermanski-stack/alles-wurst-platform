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
    <>
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <Link
          href="/mein-bereich"
          className="text-sm text-aw-gold hover:underline"
        >
          ← Zurück zu Mein Bereich
        </Link>
        <h1 className="mt-3 font-display text-2xl font-bold text-aw-cream sm:text-3xl">
          Foren
        </h1>
        <p className="mt-1.5 text-sm text-aw-muted">
          Tausche dich mit der Community aus. Vor dem ersten Beitrag musst du
          die{" "}
          <Link href="/forenregeln" className="text-aw-gold underline">
            Forenregeln
          </Link>{" "}
          akzeptieren.
        </p>
      </div>

      <CommunityOverview forums={forums} activity={activity} />
    </>
  );
}
