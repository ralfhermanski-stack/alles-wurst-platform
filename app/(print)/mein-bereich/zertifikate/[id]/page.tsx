import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import CertificateDocument from "@/components/certificates/CertificateDocument";
import CertificatePrintToolbar from "@/components/certificates/CertificatePrintToolbar";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";
import { issueCertificateOnFirstAccess } from "@/lib/certificates/certificate-issue-service";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const access = await getSessionUserIdFromCookies();

  if (!access) {
    return { title: "Zertifikat", robots: { index: false, follow: false } };
  }

  const result = await issueCertificateOnFirstAccess(id, access);

  if (!result.success) {
    return { title: "Zertifikat", robots: { index: false, follow: false } };
  }

  return {
    title: `Zertifikat ${result.data.certificateNumber}`,
    robots: { index: false, follow: false },
  };
}

export default async function CertificatePrintPage({ params }: PageProps) {
  const { id } = await params;
  const userId = await getSessionUserIdFromCookies();

  if (!userId) {
    redirect(`/anmelden?next=/mein-bereich/zertifikate/${id}`);
  }

  const result = await issueCertificateOnFirstAccess(id, userId);

  if (!result.success) {
    notFound();
  }

  const certificate = result.data;

  return (
    <div className="min-h-screen bg-aw-bg print:bg-white">
      <CertificatePrintToolbar
        certificateId={certificate.certificateId}
        certificateNumber={certificate.certificateNumber}
        courseTitle={certificate.courseTitle}
        kind={certificate.kind}
      />
      <div className="px-4 py-8 print:p-0">
        <CertificateDocument data={certificate} />
      </div>
    </div>
  );
}
