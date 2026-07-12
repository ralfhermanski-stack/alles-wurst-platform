# Zentrales E-Mail-System

## Architektur

```
Aufrufer (Auth, Stripe, Datenschutz, Support, Admin)
        ↓
sendPlatformEmail() / sendMail() (Legacy-Wrapper)
        ↓
Warteschlange (EmailMessage) + Protokoll
        ↓
email-provider-runtime → lib/mail Provider-Adapter
```

## Kernservice

`lib/email/email-service.ts` — einzige reguläre Schnittstelle für Versand.

## Admin

**Kommunikation → E-Mail** unter `/admin/kommunikation/email/*`

## Kategorien

AUTH, ACCOUNT, SUPPORT, TICKET, ORDER, BILLING, PRIVACY, WITHDRAWAL, NEWSLETTER, …

## Abgrenzung Account-Nachricht vs. E-Mail

| Kanal | Speicherort | Extern |
|-------|-------------|--------|
| Account-Nachricht | `user_account_messages` | Nein |
| E-Mail | `email_messages` + Provider | Ja |

Konfigurierbar pro Kategorie (`email_category_configs.also_account_message`).

## Keine Benutzer-zu-Benutzer-E-Mails

- Keine freie Empfängereingabe für normale Benutzer
- Manueller Versand nur mit Mitarbeiterberechtigung `email.send`
- Empfänger über interne Benutzer-ID, nicht freie Adressliste

## Queue & Retry

Status: PENDING → PROCESSING → SENT / RETRYING / FAILED

Retry: sofort, 5 Min., 30 Min., 2 Std., 12 Std.

Cron: `POST /api/cron/email-queue` mit `Authorization: Bearer <EMAIL_CRON_SECRET>`

## APIs

| Route | Zweck |
|-------|-------|
| `GET /api/admin/email/dashboard` | Kennzahlen |
| `GET /api/admin/email?resource=` | Listen |
| `POST /api/admin/email` | Queue verarbeiten |
| `POST /api/admin/email/send` | Test/Manuell |
| `POST /api/cron/email-queue` | Cron-Worker |
| `POST /api/webhooks/email` | Zustellstatus |

## Umgebungsvariablen

- `MAIL_PROVIDER`, `MAIL_FROM`, `SMTP_*`, `BREVO_API_KEY`, `RESEND_API_KEY`
- `EMAIL_CRON_SECRET` (min. 32 Zeichen)
- `EMAIL_ENCRYPTION_SECRET` (optional, Fallback: `AUTH_SESSION_SECRET`)

## Tests

`node scripts/test-email-system.cjs`

## Produktion

Siehe `docs/EMAIL_PRODUKTION_EINRICHTUNG.md`
