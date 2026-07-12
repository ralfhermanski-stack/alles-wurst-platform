# E-Mail-Produktion einrichten

## 1. Domain vorbereiten

- SPF, DKIM, DMARC für alle Absenderdomains konfigurieren
- Absenderadressen beim Provider verifizieren

## 2. Provider und Absender im Admin (empfohlen)

1. **Kommunikation → E-Mail → Provider** — Provider anlegen, Zugangsdaten speichern, aktivieren, testen
2. **Kommunikation → E-Mail → Absender** — Adressen anlegen, Kategorien zuweisen, als verifiziert markieren
3. **Kommunikation → E-Mail → Testversand** — Testmail senden

## 3. Alternative: Provider über `.env`

Empfohlen für Produktion: Resend, Brevo oder SMTP mit TLS.

```
MAIL_PROVIDER=resend
MAIL_FROM=noreply@deine-domain.de
MAIL_FROM_NAME=Alles Wurst
RESEND_API_KEY=...
```

Alternativ im Admin unter **Kommunikation → E-Mail → Provider** (verschlüsselt in DB).

## 3. Absender anlegen

Admin → **Absender** — jede Adresse als verifiziert markieren, Kategorien zuweisen.

## 4. Testmail

Admin → **Testversand** — Empfänger prüfen, Vorlage `auth.verify` testen.

## 5. Cron einrichten

```
POST https://deine-domain.de/api/cron/email-queue
Authorization: Bearer <EMAIL_CRON_SECRET>
```

`EMAIL_CRON_SECRET` mindestens 32 Zeichen — **niemals** als Query-Parameter.

## 6. Webhooks

Provider-Webhook auf `POST /api/webhooks/email`:

```
Authorization: Bearer <EMAIL_WEBHOOK_SECRET>
```

`EMAIL_WEBHOOK_SECRET` mindestens 32 Zeichen — **niemals** als Query-Parameter.  
Ohne gültigen Bearer-Header antwortet die Route mit HTTP 401.

Bei nativen Provider-Signaturen (z. B. Postmark, SES) kann die Integration später um signaturbasierte Prüfung ergänzt werden; bis dahin schützt das Shared Secret den Endpunkt.

## 7. Monitoring

Admin-Dashboard: fehlgeschlagene Mails, Warteschlange, Bounce-Rate.

## Checkliste vor Livegang

- [ ] Keine `localhost`-Links in `NEXT_PUBLIC_APP_URL`
- [ ] Alle Systemvorlagen aktiv
- [ ] Absender verifiziert
- [ ] Cron läuft alle 1–5 Minuten
- [ ] Testmail empfangen

**Keine echten Zugangsdaten in dieser Dokumentation hinterlegen.**
