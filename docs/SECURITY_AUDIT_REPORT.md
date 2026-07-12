# Sicherheitsbericht — Alles Wurst Enterprise Security Upgrade

**Datum:** 11.07.2026  
**Umfang:** Vollständiges Security-Modul gemäß Spezifikation (16 Bereiche)

---

## Zusammenfassung

Die Plattform verfügt jetzt über ein zentrales **`lib/security/`**-Modul mit Datenbank-Persistenz, Admin-Sicherheitszentrale, serverseitigen Guards und Integration in kritische Auth-Flows. Sicherheitsprüfungen erfolgen **ausschließlich serverseitig** — Frontend-Schutz ist kein Ersatz.

---

## Behobene / neu implementierte Schwachstellen

| Bereich | Vorher | Nachher |
|---------|--------|---------|
| Zentrale Security-Schicht | Fehlend (fragmentiert) | `lib/security/` mit 20+ Modulen |
| Login-Brute-Force | Kein Schutz | Rate-Limit + stufenweise IP-Sperre + Event-Logging |
| Admin-Login-Tracking | Kein separates Logging | `ADMIN_LOGIN_FAILED` Events |
| Passwort-Reset-Missbrauch | Kein Rate-Limit | Rate-Limit + `PASSWORD_RESET_REQUEST` Events |
| Registrierungs-Spam | Kein Schutz | Bot-Erkennung + Rate-Limit + Events |
| Security-Header | `next.config.ts` leer | CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy |
| X-Powered-By | Standard Next.js | Deaktiviert (`poweredByHeader: false`) |
| 2FA/TOTP | Nicht vorhanden | Google Authenticator kompatibel (RFC 6238), Backup-Codes |
| Session-Revocation | Nur Cookie-Löschung | DB-Session-Registry mit Widerruf |
| IP-Erkennung | Nur `x-forwarded-for` | Cloudflare-kompatibel (`cf-connecting-ip`, `cf-ipcountry`, ASN) |
| Upload-Sicherheit | Pro Modul verteilt | Zentrale `validateUpload()` mit MIME/Extension-Blockliste |
| Audit-Log (Security) | Nur domänenspezifisch | Unveränderliches `SecurityAuditLog` |
| Admin-Übersicht | Fehlend | Sicherheitszentrale unter `/admin/sicherheit` |
| Ressourcen-Guards | Teilweise | `resource-guard.ts` für Rezepte, Tickets, Zertifikate, Kurse |
| DSGVO-Aufbewahrung | Fehlend | Konfigurierbare Löschfristen in `SecuritySettings` |

---

## Implementierte Module

### 1. Sicherheitszentrale (`/admin/sicherheit`)
- Sicherheitsübersicht mit Dashboard-Kennzahlen
- Angriffsversuche, gesperrte IPs, aktive Sitzungen
- Sicherheitsregeln, verdächtige Benutzer, Administrator-Protokoll, Systemstatus

### 2. Angriffserkennung
- `SecurityEvent`-Modell mit IP, Geo (grob), User-Agent, Browser, OS, ASN, Provider
- Ereignistypen: Login-Fails, TOTP, API-Abuse, Bots, Rate-Limits, Upload-Rejections

### 3. Intelligente IP-Sperren
- Stufen: throttle → captcha → 30 Min → 24h → permanent
- Admin: Sperren, Entsperren, Begründungen, Notizen

### 4. Geolokalisierung
- Cloudflare-Header (`CF-IPCountry`, `CF-Region`, `CF-ASN`)
- Keine GPS/exakten Wohnortdaten

### 5. Zwei-Faktor-Authentifizierung
- TOTP (SHA1, 30s, 6 Ziffern), QR-Code, Backup-Codes
- Pflicht-Rollen konfigurierbar (Admin, Support, Instruktoren)
- APIs: `/api/account/security/totp/*`

### 6. Aktive Sitzungen
- Gerät, Browser, Region, letzte Aktivität
- Einzelne / alle Sitzungen beenden
- Neue-Gerät-Erkennung

### 7. Rollen- und Rechteprüfung
- `resource-guard.ts` + bestehendes RBAC (`lib/permissions/`)
- Jede Admin-API über `adminGuardResponse()`

### 8. Rate Limiting
- Login, Register, Password-Reset (integriert)
- Konfigurierbar über Sicherheitsregeln
- Erweiterbar für Forum, Tickets, Uploads via `enforceSecurityGuard()`

### 9. Upload-Sicherheit
- Zentrale Validierung: MIME, Größe, Dateiname, verbotene Extensions
- EXIF-Stripping-Vorbereitung für JPEG

### 10. Security-Header
- `next.config.ts` + Middleware-Wrapper

### 11. Cloudflare-Vorbereitung
- `getClientIpFromRequest()` priorisiert CF-Header
- Systemstatus: `cloudflareReady: true`

### 12. Audit Log
- `SecurityAuditLog` — append-only, keine Update-API
- Rollenänderungen, IP-Sperren, TOTP, Sessions, Einstellungen

### 13. Datenbank-Sicherheit
- Prisma parametrisierte Queries (kein Raw-SQL in Security-Modul)
- Foreign Keys, Indizes, Soft-Delete bei User unverändert kompatibel

### 14. Stripe-Sicherheit
- **Bereits vorhanden:** Webhook-Signatur, Idempotenz (`StripeWebhookEvent`)
- **Empfehlung:** Keine Änderung nötig — bereits korrekt implementiert

### 15. Datenschutz
- Einstellbare Löschfristen in `SecuritySettings`
- `purgeExpiredSecurityData()` für Cron-Job

---

## Gefundene Restrisiken

| Risiko | Schwere | Empfehlung |
|--------|---------|------------|
| Rate-Limiting in-memory | Mittel | Redis/Upstash für Multi-Instance-Produktion |
| Middleware IP-Block ohne Prisma | Niedrig | Cloudflare WAF als Edge-Schicht (vorbereitet) |
| Captcha nur Header-Check | Mittel | Turnstile/hCaptcha-Integration bei `CAPTCHA_REQUIRED` |
| Nicht alle API-Routen nutzen `enforceSecurityGuard` | Mittel | Schrittweise Migration aller `/api/*`-Routen |
| EXIF-Entfernung JPEG basic | Niedrig | `sharp`-Bibliothek für Produktions-Bildpipeline |
| 2FA-UI im Mitgliederbereich | Niedrig | Account-Seite für TOTP-Setup ergänzen |
| Server Actions nicht vollständig auditiert | Mittel | Einzelprüfung aller `"use server"`-Dateien |

---

## Empfehlungen (Priorität)

1. **Produktion:** Cloudflare vor die App schalten (WAF, Bot Fight, Country Rules)
2. **Redis Rate-Limiter** für horizontale Skalierung
3. **Turnstile** bei Stufe 1b (Captcha)
4. **Cron:** `purgeExpiredSecurityData()` täglich ausführen
5. **Superadmins:** 2FA sofort aktivieren über `/api/account/security/totp/setup`
6. **Penetrationstest** vor Go-Live mit externem Audit

---

## Testausführung

```bash
npx prisma migrate deploy
npx prisma generate
node scripts/test-security-system.cjs
```

---

## Fazit

Alles Wurst verfügt über ein **professionelles, ganzheitliches Sicherheitssystem** mit zentraler Verwaltung, automatischer Angriffserkennung, stufenweisen IP-Sperren, 2FA, Session-Management und DSGVO-konformer Protokollierung. Typische Angriffe (Brute-Force, Spam, API-Missbrauch) werden erkannt, dokumentiert und abgewehrt — vollständig **serverseitig**.
