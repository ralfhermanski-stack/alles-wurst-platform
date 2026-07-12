import Link from "next/link";

import type { PublicCertificateShareView as PublicCertificateShareViewData } from "@/lib/sharing/share-types";

type Props = {
  data: PublicCertificateShareViewData;
  shareUrl: string;
  ogImageUrl: string;
};

export default function PublicCertificateShareView({ data, shareUrl, ogImageUrl }: Props) {
  const label = data.contentType === "DIPLOMA" ? "Teilnahmeurkunde" : "Zertifikat";

  return (
    <div className="min-h-screen bg-aw-bg px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-aw-gold/30 bg-gradient-to-br from-aw-surface to-aw-bg p-8 shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <p className="font-display text-lg font-bold text-aw-gold">ALLES WURST</p>
            <span className="rounded-full border border-aw-gold/40 px-3 py-1 text-xs text-aw-gold">
              {label}
            </span>
          </div>

          <h1 className="mt-8 font-display text-3xl font-bold text-aw-cream sm:text-4xl">
            {data.title}
          </h1>

          <dl className="mt-8 grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-aw-muted">Absolvent</dt>
              <dd className="mt-1 text-lg text-aw-cream">{data.studentName}</dd>
            </div>
            <div>
              <dt className="text-aw-muted">Kurs</dt>
              <dd className="mt-1 text-lg text-aw-cream">{data.courseTitle}</dd>
            </div>
            <div>
              <dt className="text-aw-muted">Ausstellungsdatum</dt>
              <dd className="mt-1 text-aw-cream">{data.issuedAt ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-aw-muted">Zertifikatsnummer</dt>
              <dd className="mt-1 font-mono text-aw-cream">{data.certificateNumber ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-aw-muted">Verifikationsstatus</dt>
              <dd className="mt-1 text-aw-cream">
                {data.verificationStatus === "valid"
                  ? "Gültig und verifizierbar"
                  : data.verificationStatus === "revoked"
                    ? "Widerrufen"
                    : "Ungültig"}
              </dd>
            </div>
          </dl>

          {data.verificationUrl ? (
            <div className="mt-8">
              <Link href={data.verificationUrl} className="text-sm font-semibold text-aw-gold hover:text-aw-cream">
                Zertifikat online verifizieren →
              </Link>
            </div>
          ) : null}
        </div>

        <p className="mt-6 text-center text-xs text-aw-muted">
          Geteilt über ALLES WURST ·{" "}
          <a href={shareUrl} className="text-aw-gold">
            {shareUrl}
          </a>
        </p>
        <meta property="og:image" content={ogImageUrl} />
      </div>
    </div>
  );
}
