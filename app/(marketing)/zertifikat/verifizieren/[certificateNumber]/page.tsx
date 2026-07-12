import Link from "next/link";

import { VERIFICATION_STATUS_LABELS } from "@/lib/certificates/certificate-labels";
import { verifyCertificate } from "@/lib/certificates/certificate-verification-service";

type PageProps = {
  params: Promise<{ certificateNumber: string }>;
  searchParams: Promise<{ token?: string }>;
};

export default async function CertificateVerificationPage({
  params,
  searchParams,
}: PageProps) {
  const { certificateNumber } = await params;
  const { token } = await searchParams;

  const result = await verifyCertificate({
    certificateNumber: decodeURIComponent(certificateNumber),
    token: token ?? null,
  });

  const statusLabel = VERIFICATION_STATUS_LABELS[result.status];

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-wider text-aw-muted">
        Alles-Wurst Zertifikatsverifikation
      </p>
      <h1 className="mt-2 font-display text-3xl font-bold text-aw-cream">
        {statusLabel}
      </h1>
      <p className="mt-3 text-sm text-aw-muted">{result.message}</p>

      <dl className="mt-8 space-y-4 rounded-xl border border-aw-border bg-aw-surface/60 p-6 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-aw-muted">Zertifikatsnummer</dt>
          <dd className="font-mono text-aw-cream">
            {result.certificateNumber ?? certificateNumber}
          </dd>
        </div>
        {result.studentName && (
          <div className="flex justify-between gap-4">
            <dt className="text-aw-muted">Teilnehmer</dt>
            <dd className="text-aw-cream">{result.studentName}</dd>
          </div>
        )}
        {result.courseTitle && (
          <div className="flex justify-between gap-4">
            <dt className="text-aw-muted">Kurs</dt>
            <dd className="text-aw-cream">{result.courseTitle}</dd>
          </div>
        )}
        {result.issuedAt && (
          <div className="flex justify-between gap-4">
            <dt className="text-aw-muted">Ausstellungsdatum</dt>
            <dd className="text-aw-cream">{result.issuedAt}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-aw-muted">Status</dt>
          <dd
            className={
              result.status === "valid"
                ? "text-aw-gold"
                : result.status === "revoked"
                  ? "text-aw-warning"
                  : "text-aw-muted"
            }
          >
            {statusLabel}
          </dd>
        </div>
      </dl>

      <p className="mt-8 text-center text-sm text-aw-muted">
        <Link href="/akademie/kurse" className="text-aw-gold hover:text-aw-cream">
          Zur Akademie
        </Link>
      </p>
    </div>
  );
}
