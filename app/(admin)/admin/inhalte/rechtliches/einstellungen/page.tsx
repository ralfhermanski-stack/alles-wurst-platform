import AdminLegalNav from "@/components/admin/legal/AdminLegalNav";

export default function AdminRechtlichesEinstellungenPage() {
  return (
    <AdminLegalNav>
      <div className="space-y-4 rounded-xl border border-aw-border bg-aw-surface p-6 text-sm text-aw-muted">
        <p>
          Cron-Endpunkt:{" "}
          <code className="text-aw-cream">POST /api/cron/legal-documents</code>
        </p>
        <p>
          Authentifizierung:{" "}
          <code className="text-aw-cream">
            Authorization: Bearer &lt;LEGAL_CRON_SECRET&gt;
          </code>
        </p>
        <p>
          Umgebungsvariable:{" "}
          <code className="text-aw-cream">LEGAL_CRON_SECRET</code> (min. 32
          Zeichen)
        </p>
        <p>
          Verschlüsselung externer Zugangsdaten:{" "}
          <code className="text-aw-cream">LEGAL_CREDENTIALS_KEY</code>
        </p>
        <p className="text-xs text-aw-warning">
          Rechtstexte werden nicht automatisch formuliert. Externe URLs und
          Anbieterzugänge müssen fachlich geprüft konfiguriert werden.
        </p>
      </div>
    </AdminLegalNav>
  );
}
