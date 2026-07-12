import type { Metadata } from "next";
import { notFound } from "next/navigation";

import PublicCertificateShareView from "@/components/sharing/PublicCertificateShareView";
import {
  getPublicCertificateShare,
  getShareMetadata,
  recordShareEvent,
} from "@/lib/sharing/share-service";
import { buildShareOgImageUrl, buildShareUrl } from "@/lib/sharing/share-token";

type PageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const data = await getPublicCertificateShare(token, "CERTIFICATE");

  if (!data) {
    return { title: "Nicht gefunden", robots: { index: false, follow: false } };
  }

  return getShareMetadata({
    title: data.title,
    description: `${data.studentName} — ${data.courseTitle}`,
    shareToken: token,
    contentType: "CERTIFICATE",
  });
}

export default async function PublicCertificateSharePage({ params }: PageProps) {
  const { token } = await params;
  const data = await getPublicCertificateShare(token, "CERTIFICATE");

  if (!data) {
    notFound();
  }

  await recordShareEvent(token, "view");

  return (
    <PublicCertificateShareView
      data={data}
      shareUrl={buildShareUrl(data.contentType, token)}
      ogImageUrl={buildShareOgImageUrl(token)}
    />
  );
}
