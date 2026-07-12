# E-Mail-System — Bestandsaufnahme

## Bereits vorhanden (wiederverwendet)

| Komponente | Pfad | Status |
|------------|------|--------|
| Mail-Provider-Adapter | `lib/mail/mail-providers/*` | SMTP, Brevo, Resend |
| ENV-Konfiguration | `lib/mail/mail-config.ts` | Fallback für Provider |
| Branded HTML-Layout | `lib/mail/system-mail-templates.ts` | → `lib/email/email-layout.ts` |
| Auth-Mails | `lib/auth/email-verification-service.ts`, `password-reset-service.ts` | über `sendMail()` |
| Platform-Texte | Kategorie `emails` | Auth-Texte aktiv |
| Account-Nachrichten | `lib/account/account-message-service.ts` | parallel zu E-Mail |
| Cron-Auth-Muster | `lib/legal/legal-cron-auth.ts` | → `lib/email/email-cron-auth.ts` |
| Secret-Verschlüsselung | `lib/stripe/stripe-key-crypto.ts` | → `lib/email/email-crypto.ts` |

## Migrierte System-E-Mails

- Datenschutz Export-Bestätigung → `privacy.export.confirm`
- Datenschutz Export bereit → `privacy.export.ready`
- Datenschutz Lösch-Bestätigung → `privacy.deletion.confirm`
- Support-Ticket-Antwort → `ticket.reply`
- Auth, Stripe, Widerruf → weiter über `sendMail()` → zentrale Queue

## Neu gebaut

- Prisma-Modelle: Provider, Absender, Vorlagen, Queue, Protokoll, Suppression, Präferenzen
- `lib/email/email-service.ts` — `sendPlatformEmail()`
- Admin: Kommunikation → E-Mail (10 Unterseiten)
- Cron: `POST /api/cron/email-queue`
- Webhook: `POST /api/webhooks/email`

## Bewusst nicht doppelt gebaut

- Kein zweites SMTP-System — bestehende Adapter werden über `email-provider-runtime.ts` genutzt
- Kein Benutzer-zu-Benutzer-E-Mail — serverseitig blockiert
- Newsletter-Marketing-Vollsystem — nur Basis (Präferenzen + Kategorie NEWSLETTER)

## Noch offen / Einschränkungen

- Postmark, SES, Mailgun, SendGrid: Architektur vorbereitet, Adapter noch nicht vollständig
- Massenversand-UI: Berechtigung `email.bulk.send`, Batch-Logik über Queue — dedizierte UI minimal
- Instructor-Kursversand: standardmäßig deaktiviert
- Reply-by-E-Mail für Tickets: nicht implementiert (wie beauftragt)
- Vollständiger Vorlagen-Editor im Admin: JSON-Ansicht, kein WYSIWYG
