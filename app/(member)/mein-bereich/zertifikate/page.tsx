"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { USER_CERTIFICATE_STATUS_LABELS } from "@/lib/certificates/certificate-labels";
import type { CertificateSummary } from "@/lib/certificates/certificate-types";

export default function MyCertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateSummary[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const response = await fetch("/api/certificates/my", {
        credentials: "include",
      });
      const data = (await response.json()) as {
        success: boolean;
        data?: CertificateSummary[];
        error?: { message: string };
      };

      if (cancelled) {
        return;
      }

      if (!data.success) {
        setError(data.error?.message ?? "Zertifikate konnten nicht geladen werden.");
        return;
      }

      setCertificates(data.data ?? []);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-aw-cream">
        Meine Urkunden &amp; Zertifikate
      </h1>
      <p className="mt-2 text-sm text-aw-muted">
        Teilnahmeurkunden und Zertifikate nach abgeschlossenen Kursen.
      </p>

      {error && (
        <p className="mt-4 text-sm text-aw-warning" role="alert">
          {error}
        </p>
      )}

      {certificates.length === 0 ? (
        <p className="mt-8 text-sm text-aw-muted">
          Noch keine Zertifikate verfügbar.{" "}
          <Link href="/mein-bereich/kurse" className="text-aw-gold">
            Zu meinen Kursen
          </Link>
        </p>
      ) : (
        <ul className="mt-8 space-y-4">
          {certificates.map((certificate) => (
            <li
              key={certificate.id}
              className="rounded-xl border border-aw-border bg-aw-surface/40 p-5"
            >
              <p className="text-xs text-aw-muted">
                {USER_CERTIFICATE_STATUS_LABELS[certificate.status]}
              </p>
              <h2 className="font-display text-lg font-bold text-aw-cream">
                {certificate.courseTitle}
              </h2>
              {certificate.certificateNumber && (
                <p className="mt-1 font-mono text-xs text-aw-muted">
                  {certificate.certificateNumber}
                </p>
              )}
              {(certificate.status === "available" ||
                certificate.status === "issued") && (
                <Link
                  href={`/mein-bereich/zertifikate/${certificate.id}`}
                  className="mt-4 inline-block text-sm font-semibold text-aw-gold hover:text-aw-cream"
                  target="_blank"
                  rel="noreferrer"
                >
                  {certificate.status === "issued"
                    ? "Zertifikat anzeigen"
                    : "Zertifikat abrufen"}
                  {" →"}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
