import type { Metadata } from "next";
import { Suspense } from "react";

import AdminSecurityPanel from "@/components/admin/security/AdminSecurityPanel";

export const metadata: Metadata = {
  title: "Admin – Sicherheit",
};

export default function AdminSecurityPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <h1 className="font-display text-2xl font-bold text-aw-cream">Sicherheitszentrale</h1>
      <p className="mt-2 text-sm text-aw-muted">
        Angriffserkennung, IP-Sperren, Sitzungen, Audit-Protokoll und Systemstatus — alles
        serverseitig geschützt.
      </p>

      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-aw-muted">Laden …</p>}>
          <AdminSecurityPanel />
        </Suspense>
      </div>
    </div>
  );
}
