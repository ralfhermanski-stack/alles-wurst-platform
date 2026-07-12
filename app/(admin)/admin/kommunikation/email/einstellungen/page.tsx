import AdminEmailNav from "@/components/admin/email/AdminEmailNav";

export default function AdminEmailSettingsPage() {
  return (
    <AdminEmailNav>
      <div className="rounded-xl border border-aw-border bg-aw-surface p-5 text-sm text-aw-muted">
        <p>
          Kategorie-Zuordnungen, Aufbewahrungsfristen und Marketing-Einstellungen werden
          über die Kategorie-Konfiguration und Benutzer-Präferenzen gesteuert.
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5">
          <li>Pflichtkommunikation (Auth, Bestellung, Datenschutz) ist nicht abstellbar</li>
          <li>Newsletter und Community-Mails respektieren Einwilligungen</li>
          <li>Tracking von Öffnungen/Klicks ist standardmäßig deaktiviert</li>
          <li>Cron: POST /api/cron/email-queue mit Bearer EMAIL_CRON_SECRET</li>
          <li>
            Webhook: POST /api/webhooks/email mit Bearer EMAIL_WEBHOOK_SECRET
          </li>
        </ul>
      </div>
    </AdminEmailNav>
  );
}
