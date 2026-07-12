import type { Metadata } from "next";

import CommunityOverview from "@/components/community/CommunityOverview";
import PageHeader from "@/components/marketing/PageHeader";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";
import { getCommunityOverview } from "@/lib/forums/forum-community-service";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/community", {
    title: "Community",
    description:
      "Forum und Mitgliederprofile – tausche dich mit Gleichgesinnten aus.",
  });
}

export default async function CommunityPage() {
  const userId = await getSessionUserIdFromCookies();
  const { forums, activity } = await getCommunityOverview(userId);

  return (
    <>
      <PageHeader
        eyebrow="Community"
        title="Das Handwerk lebt vom Austausch"
        description="Forum und Profile – hier trifft sich die Alles-Wurst-Gemeinschaft."
      />

      <CommunityOverview forums={forums} activity={activity} />
    </>
  );
}
