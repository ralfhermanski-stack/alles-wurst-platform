"use client";

import { useEffect, useState } from "react";

import { USER_CERTIFICATE_STATUS_LABELS } from "@/lib/certificates/certificate-labels";

type CertificateReadOnlyEntry = {
  id: string;
  certificateNumber: string | null;
  status: string;
  courseTitle: string;
  issuedAt: string | null;
  studentName: string;
};

type CertificateReadOnlyPanelProps = {
  userId: string;
};

export default function CertificateReadOnlyPanel({
  userId,
}: CertificateReadOnlyPanelProps) {
  const [entries, setEntries] = useState<CertificateReadOnlyEntry[]>([]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const response = await fetch(`/api/accounting/certificates/users/${userId}`, {
        credentials: "include",
      });
      const data = (await response.json()) as {
        success: boolean;
        data?: CertificateReadOnlyEntry[];
      };

      if (!cancelled && data.success) {
        setEntries(data.data ?? []);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="rounded-xl border border-aw-border bg-aw-surface/40 p-5">
      <h2 className="font-display text-lg font-bold text-aw-gold">
        Zertifikate (nur Ansicht)
      </h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead className="text-xs uppercase text-aw-muted">
            <tr>
              <th className="px-2 py-2">Nummer</th>
              <th className="px-2 py-2">Kurs</th>
              <th className="px-2 py-2">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-aw-border text-aw-cream">
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td className="px-2 py-2 font-mono text-xs">
                  {entry.certificateNumber ?? "—"}
                </td>
                <td className="px-2 py-2">{entry.courseTitle}</td>
                <td className="px-2 py-2 text-aw-muted">
                  {USER_CERTIFICATE_STATUS_LABELS[
                    entry.status as keyof typeof USER_CERTIFICATE_STATUS_LABELS
                  ] ?? entry.status}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
