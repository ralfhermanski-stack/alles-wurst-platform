import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PublicRecipeShareView from "@/components/sharing/PublicRecipeShareView";
import {
  getPublicRecipeShare,
  getShareMetadata,
  recordShareEvent,
} from "@/lib/sharing/share-service";
import { buildShareOgImageUrl, buildShareUrl } from "@/lib/sharing/share-token";

type PageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const data = await getPublicRecipeShare(token);

  if (!data) {
    return { title: "Nicht gefunden", robots: { index: false, follow: false } };
  }

  return getShareMetadata({
    title: data.title,
    description: data.description ?? `Rezept von ${data.authorName}`,
    shareToken: token,
    contentType: "RECIPE",
  });
}

export default async function PublicRecipeSharePage({ params }: PageProps) {
  const { token } = await params;
  const data = await getPublicRecipeShare(token);

  if (!data) {
    notFound();
  }

  await recordShareEvent(token, "view");

  return (
    <PublicRecipeShareView
      data={data}
      shareUrl={buildShareUrl("RECIPE", token)}
      ogImageUrl={buildShareOgImageUrl(token)}
    />
  );
}
