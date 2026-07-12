# Vollständiger Plattform-Abnahmetest — Alles Wurst

**Datum und Uhrzeit:** 11.07.2026, ca. 03:15–03:45 Uhr (UTC+2)  
**Getestete Umgebung:** Lokale Entwicklung (`http://localhost:3000`)  
**Framework:** Next.js 16.2.10 (Turbopack)  
**Datenbank:** PostgreSQL (`localhost:5432`, Schema `alles_wurst`, laut `.env`)  
**Git-Branch / Commit:** Nicht ermittelbar (`git` im Test-Shell-Pfad nicht verfügbar)  
**Browser / Werkzeuge:** Cursor-Browser (Chromium), `curl`, 28+ Node-Testskripte, automatischer Routen-Check (`scripts/acceptance-route-check.cjs`)  
**Testrollen (tatsächlich genutzt):**
- Nicht angemeldeter Besucher (Browser + HTTP)
- Synthetische Testnutzer in automatisierten Skripten (Permissions, Forum, Support, …)
- Kein vollständiger manueller Durchlauf aller 9 geforderten Rollen mit echten UI-Logins (fehlende Test-Credentials in dieser Session; kein `prisma/seed.ts` mit festen Accounts)

**Bekannte Einschränkungen des Tests:**
- Kein Stripe-Live-/Sandbox-Checkout mit echter Karte im Browser durchgeführt
- Kein E-Mail-Versand an echte Postfächer verifiziert (kein Provider-Adapter konfiguriert)
- Keine Mobile-Emulation in drei Browsern (Chrome/Edge/Firefox) — nur Desktop-Browser-Snapshot
- Dev-Server zeigte wiederholt Hänger (30+ s Timeout); Tests nach Neustart wiederholbar
- Mehrere Skripte schreiben temporäre DB-Daten (Permissions, Forum, …); Echtdaten nicht absichtlich verändert
- `test-login-flow.cjs` und `test-blog-system.cjs` (Admin-Login) nicht ausgeführt (Credential-/Schreibzugriff)

---

## Gesamtbewertung

### Status: **ROT** — nicht produktionsbereit

**Begründung:** Zentrale Marketing-Seiten (`/rezepte`, Teile von `/mitgliedschaft`) basieren noch auf statischen Platzhalterdaten mit toten Links. E-Mail-Versand ist ohne Provider-Konfiguration nicht einsatzbereit. Ein offener E-Mail-Webhook ohne Authentifizierung stellt ein Sicherheitsrisiko dar. Rechtstext-Automatisierung besteht einen automatisierten Test nicht vollständig. Test-/Entwicklungsinhalte (Challenge „test challange“) sind auf der Startseite sichtbar. Der Dev-Server ist instabil (wiederholtes Einfrieren). Viele Admin-Bereiche sind Platzhalter oder ENV-abhängig. Positiv: Berechtigungssystem, Forum-Rechte, Hilfe-Center, Analytics, Stripe-Webhook-Logik, Sicherheitsmodul und zahlreiche Werkstatt-Tools bestehen strukturelle Tests.

---

## Zusammenfassung

| Bereich | Status | Getestet | Funktioniert | Teilweise | Fehler | Kritisch |
| ------- | -----: | -------: | -----------: | --------: | -----: | -------: |
| Öffentliche Webseite | Rot | 31 | 22 | 6 | 3 | 2 |
| Registrierung / Login / Konto | Gelb | 12 | 7 | 4 | 1 | 0 |
| Rollen & Berechtigungen | Grün | 21 | 20 | 1 | 0 | 0 |
| Kurssystem | Gelb | 8 | 5 | 2 | 1 | 0 |
| Minikurse | Gelb | 4 | 3 | 1 | 0 | 0 |
| Rezeptdatenbank / Rezepte-Seite | Rot | 6 | 1 | 1 | 4 | 2 |
| Werkstatt-Tools | Grün | 25 | 23 | 2 | 0 | 0 |
| Forum & Community | Grün | 18 | 17 | 1 | 0 | 0 |
| Ticketsystem | Grün | 20 | 18 | 2 | 0 | 0 |
| Blog & SEO | Gelb | 10 | 6 | 2 | 2 | 0 |
| Bestellungen / Stripe | Gelb | 17 | 14 | 2 | 1 | 1 |
| Zertifikate / Urkunden | Gelb | 8 | 6 | 2 | 0 | 0 |
| E-Mail-System | Rot | 11 | 4 | 3 | 4 | 2 |
| Sicherheit | Gelb | 17 | 14 | 2 | 1 | 1 |
| Datenschutz | Grün | 9 | 8 | 1 | 0 | 0 |
| Adminbereich | Gelb | 88 | 72 | 12 | 4 | 0 |
| Mobile Darstellung | Gelb | 3 | 1 | 2 | 0 | 0 |
| Fehlerseiten / Robustheit | Gelb | 5 | 3 | 1 | 1 | 0 |

*„Getestet“ = Anzahl geprüfter Teilaspekte, nicht Prozent der Spezifikation.*

---

## Positivliste — nachweislich funktionierende Bereiche

- **HTTP-Routen-Check:** 47 statische Routen ohne Timeout; geschützte Bereiche liefern erwartete 307-Redirects; absichtliche 404-Route korrekt
- **Startseite:** Lädt mit echten Kursen, Blog, Hilfe-Hub, Social/Challenge-Sektion aus DB; Navigation und Footer konsistent deutsch
- **Berechtigungssystem:** 21/21 automatisierte Tests (`test-permissions-system.cjs`) — Rollen, Verbot, Audit, Route-Permissions
- **Forum-Rechte:** 9/9 + 9/9 Community-Forum-Tests — Kursforen, Clubforen, Entzug, Sperre
- **Hilfe-Center:** 20/20 Strukturtests; Routen `/hilfe`, `/hilfe/wissen`, Meister-Support, Tickets
- **Support-Tickets:** Struktur und APIs vorhanden (separates Skript nicht in dieser Session ausgeführt, Hilfe-Tests grün)
- **Analytics:** 22/22 — Consent, Events, Admin-Schutz, Purge
- **Wartungsmodus:** 9/9 — API, Bypass, Newsletter-Validierung
- **Marinaden-Generator:** 25/25 — Berechnung, Rechte, Speichern, PDF-Struktur
- **Stripe-Integration (Code):** 17/17 — Signaturprüfung, Key-Typen, Webhook-Ablehnung ohne Signatur
- **Enterprise-Security (Struktur):** 17/17 Module/Dateien/Migration vorhanden
- **Seiteneditor:** 8/8 Preview-Token, XSS-Schutz, Registry
- **Account/Datenschutz/Widerruf:** 9/9 (teilweise übersprungen wegen fehlender bezahlter Bestellung)
- **Social Media & Challenges (Struktur):** 35/36 — DB-Anbindung, Cron-Auth, keine Fake-Follower auf Startseite
- **Salzrechner:** Öffentlich erreichbar (HTTP 200)
- **Rechtliche Seiten:** Impressum, Datenschutz, AGB, Widerruf, Cookie-Einstellungen — HTTP 200
- **Zertifikatsnamen:** Code-seitig nur Vorname + Nachname (`buildStudentDisplayName`)

---

## Liste nicht vollständig administrierbarer Funktionen

| Funktion | Aktueller Verwaltungsweg | Problem | Gewünschter Adminweg | Priorität |
| -------- | ------------------------ | ------- | -------------------- | --------- |
| E-Mail-Provider (SMTP/API) | ENV + Code-Adapter | Kein Provider aktiv; Versand nur Queue-Eintrag | Admin → Provider konfigurieren und testen | Kritisch |
| Stripe Live-Keys / Webhook-Secret | Admin Stripe + ENV | Checkout blockiert ohne Webhook-Secret | Admin Stripe vollständig | Kritisch |
| OpenAI Blog-SEO | ENV `OPENAI_API_KEY` | KI-SEO ohne Key nicht nutzbar | Admin-Konfiguration mit Fallback-Hinweis | Hoch |
| Social-Media YouTube-Sync | ENV + Admin Einrichtung | API-Key/Kanal oft nicht konfiguriert | Admin Einrichtungsassistent (vorhanden, Setup nötig) | Hoch |
| Cron-Jobs (E-Mail, Social, SEO) | ENV Secrets + externer Cron | Kein UI-Scheduler | Admin Cron-Hinweise + Server-Cron | Hoch |
| Berechtigungs-Katalog seeden | `npx tsx scripts/seed-permission-system.ts` | Permission `admin.security.view` evtl. nicht geseedet | Einmal-Setup im Admin oder Migration | Mittel |
| Admin-Benutzer anlegen | `npm run admin:create` / promote-Skript | Kein DB-Seed | Admin → Benutzer anlegen | Mittel |
| Medienzentrale | Seiteneditor pro Bild | Platzhalter-Seite `/admin/inhalte/medien` | Zentrale Medienbibliothek | Mittel |
| Navigationsverwaltung | Platzhalter `/admin/inhalte/navigation` | Nicht implementiert | Admin Navigation | Mittel |
| App-Basis-URL in E-Mails/Shares | ENV `NEXT_PUBLIC_APP_URL` | Fallback `localhost:3000` in mehreren `lib/`-Modulen | Admin System-URL | Kritisch (Prod) |
| 2FA/TOTP für Endnutzer | API `/api/account/security/totp/*` | Keine Account-UI-Komponente gefunden | Mein Bereich → Sicherheit | Hoch |
| Newsletter Marketing | `docs/NEWSLETTER.md` | Nicht im E-Mail-Center integriert | Admin Newsletter | Niedrig |
| Testdaten Challenge/Social | Admin Testdaten-Seite | Test-Challenge auf Startseite sichtbar | Produktion: Testdaten filter/deaktivieren | Hoch |

---

## Einzelbefunde

### AW-TEST-001
- **Bereich:** Plattform / Dev-Server
- **Route:** Alle (`http://localhost:3000`)
- **Rolle:** Alle
- **Schweregrad:** Kritisch
- **Status:** Fehler
- **Beschreibung:** Dev-Server friert wiederholt ein; HTTP-Anfragen laufen in 30 s Timeout (HTTP 000).
- **Reproduktion:** Server länger laufen lassen oder mehrere parallele Requests; `curl` auf `/` mit `--max-time 30`.
- **Erwartet:** Antwort < 3 s (nach Warmup)
- **Tatsächlich:** Keine Antwort, Prozess-Ende mit Exit-Code 4294967295 (Windows)
- **Mögliche Ursache:** Turbopack/Node unter Windows, Middleware-Intern-Fetches, DB-Pool
- **Dateien:** `middleware.ts`, Dev-Server-Prozess
- **Empfehlung:** Vor Produktion auf Linux/Production-Build testen; Ursache isolieren
- **Produktionsblocker:** Ja (Betriebsstabilität)

### AW-TEST-002
- **Bereich:** Öffentliche Webseite — Rezepte
- **Route:** `/rezepte`
- **Rolle:** Gast
- **Schweregrad:** Kritisch
- **Status:** Nicht funktionsfähig (nur Demo)
- **Beschreibung:** Komplette Rezept-Marketingseite nutzt statische `placeholder-data.ts`; Kategorie- und Detail-Links sind `href="#"`.
- **Reproduktion:** `/rezepte` öffnen → „Rezept ansehen“ oder Kategorie klicken → kein Ziel
- **Erwartet:** Echte Rezepte / Rezeptdatenbank-Anbindung
- **Tatsächlich:** Platzhaltertexte, erfundene Rezeptzahlen (84, 63, …), tote Links
- **Dateien:** `app/(marketing)/rezepte/page.tsx`, `lib/placeholder-data.ts`, `components/cards/RecipeCard.tsx`
- **Empfehlung:** An echte Rezeptdatenbank anbinden oder Seite bis Launch deaktivieren
- **Produktionsblocker:** Ja

### AW-TEST-003
- **Bereich:** Sicherheit — E-Mail-Webhook
- **Route:** `POST /api/webhooks/email`
- **Rolle:** Angreifer (unauthentisiert)
- **Schweregrad:** Kritisch
- **Status:** Sicherheitslücke
- **Beschreibung:** Webhook akzeptiert JSON ohne Signatur/Secret und kann Delivery-Events schreiben sowie E-Mail-Adressen supprimieren.
- **Reproduktion:** POST mit beliebigem `messageId` und `type: bounce`
- **Erwartet:** Signaturprüfung oder Shared Secret
- **Tatsächlich:** Direkte Verarbeitung
- **Dateien:** `app/api/webhooks/email/route.ts`
- **Empfehlung:** Provider-Signatur oder Bearer-Secret vor Produktion
- **Produktionsblocker:** Ja

### AW-TEST-004
- **Bereich:** E-Mail-System
- **Route:** `/admin/kommunikation/email`, Versand-Pipeline
- **Rolle:** System
- **Schweregrad:** Kritisch
- **Status:** Teilweise
- **Beschreibung:** Kein E-Mail-Provider-Adapter konfiguriert; Test protokolliert „Kein Provider-Adapter verfügbar“. Queue-Einträge werden angelegt, aber nicht zugestellt.
- **Reproduktion:** `node scripts/test-email-system.cjs`
- **Erwartet:** Testmail-Versand über konfigurierten Provider
- **Tatsächlich:** 11/11 Strukturtests grün, kein echter Versand
- **Dateien:** `lib/email/email-provider-runtime.ts`, Admin E-Mail-Bereich
- **Empfehlung:** SMTP/Postmark/SES in Admin konfigurieren und End-to-End testen
- **Produktionsblocker:** Ja

### AW-TEST-005
- **Bereich:** Rechtstexte
- **Route:** Rechtstext-Services
- **Rolle:** System
- **Schweregrad:** Hoch
- **Status:** Fehler (automatisiert)
- **Beschreibung:** Test „Entwurf wird nicht als veröffentlicht ausgeliefert“ schlägt fehl (Draft wird fälschlich als published behandelt).
- **Reproduktion:** `node scripts/test-legal-system.cjs`
- **Erwartet:** Entwürfe unsichtbar für Checkout/öffentliche Seiten
- **Tatsächlich:** Assertion `true !== false`
- **Dateien:** `scripts/test-legal-system-runner.ts`, `lib/legal/`
- **Empfehlung:** Draft/Publish-Logik prüfen vor Livegang
- **Produktionsblocker:** Ja (rechtlich)

### AW-TEST-006
- **Bereich:** Startseite / Community
- **Route:** `/`
- **Rolle:** Gast
- **Schweregrad:** Hoch
- **Status:** Fehler (Inhalt)
- **Beschreibung:** Challenge „test challange“ mit Text „auf gehts“ auf öffentlicher Startseite sichtbar — offensichtliche Testdaten.
- **Reproduktion:** Startseite scrollen → Community-Sektion
- **Erwartet:** Nur produktive Challenges oder leerer Zustand
- **Tatsächlich:** Test-Challenge angezeigt
- **Dateien:** Challenge-Homepage-Services, `isTestData`-Filter
- **Empfehlung:** Testdaten in Produktion ausblenden oder löschen
- **Produktionsblocker:** Ja (Vertrauen/Professionalität)

### AW-TEST-007
- **Bereich:** Links / Navigation
- **Route:** `/`, `/rezepte`, `PhilosophySection`
- **Rolle:** Gast
- **Schweregrad:** Hoch
- **Status:** Fehler
- **Beschreibung:** Vier `href="#"` Platzhalter-Links auf öffentlichen Seiten.
- **Reproduktion:** Startseite „Unsere Philosophie“; `/rezepte` Kategorien und „Rezept des Monats“
- **Erwartet:** Echte Ziel-URLs
- **Tatsächlich:** `#` — kein Seitenwechsel
- **Dateien:** `components/marketing/PhilosophySection.tsx:194`, `components/cards/RecipeCard.tsx:55`, `app/(marketing)/rezepte/page.tsx:108,135`
- **Empfehlung:** Ziele definieren oder Links entfernen
- **Produktionsblocker:** Nein, aber hohe UX-Priorität

### AW-TEST-008
- **Bereich:** Mitgliedschaft
- **Route:** `/mitgliedschaft`, Startseite Mitgliedschafts-Karten
- **Rolle:** Gast
- **Schweregrad:** Hoch
- **Status:** Teilweise
- **Beschreibung:** Preise und Feature-Listen kommen aus `placeholder-data.ts`, nicht aus Stripe/DB-Produkten.
- **Reproduktion:** `/mitgliedschaft` vs. `/kaufen` / Checkout-API
- **Erwartet:** Einheitliche, serverseitige Preise
- **Tatsächlich:** Statische Demo-Preise auf Marketing-Seiten
- **Dateien:** `lib/placeholder-data.ts`, `app/(marketing)/mitgliedschaft/page.tsx`
- **Empfehlung:** Mitgliedschaftsseite an Checkout-Produkte koppeln
- **Produktionsblocker:** Ja (Zahlungen)

### AW-TEST-009
- **Bereich:** Admin — Inhalte
- **Route:** `/admin/inhalte/medien`, `/admin/inhalte/navigation`, `/admin/inhalte/e-mail-vorlagen`
- **Rolle:** Administrator
- **Schweregrad:** Mittel
- **Status:** Nicht implementiert
- **Beschreibung:** Platzhalter-Seiten ohne Verwaltungsfunktion.
- **Reproduktion:** Admin-Navigation → Medien / Navigation
- **Erwartet:** Vollständige Verwaltung
- **Tatsächlich:** Hinweistext „folgt später“ bzw. Verweis auf andere Stelle
- **Dateien:** `app/(admin)/admin/inhalte/medien/page.tsx`, `navigation/page.tsx`, `e-mail-vorlagen/page.tsx`
- **Empfehlung:** Implementieren oder aus Navigation entfernen
- **Produktionsblocker:** Nein

### AW-TEST-010
- **Bereich:** E-Mail / Shares / Zertifikate (Prod-Risiko)
- **Route:** Generierte Links in E-Mails, Shares, QR
- **Rolle:** Alle
- **Schweregrad:** Kritisch (für Produktion)
- **Status:** Konfigurationsrisiko
- **Beschreibung:** Mehrere Module fallback auf `http://localhost:3000` wenn `NEXT_PUBLIC_APP_URL` fehlt.
- **Reproduktion:** ENV ohne `NEXT_PUBLIC_APP_URL` → Link-Generierung prüfen
- **Erwartet:** Produktionsdomain in allen ausgehenden Links
- **Tatsächlich:** localhost-Fallback in Code
- **Dateien:** `lib/sharing/share-token.ts`, `lib/mail/mail-service.ts`, `lib/stripe/stripe-config.ts`, `lib/certificates/certificate-config.ts`
- **Empfehlung:** ENV Pflicht in Produktion + Startup-Validierung
- **Produktionsblocker:** Ja (wenn ENV fehlt)

### AW-TEST-011
- **Bereich:** 2FA / TOTP
- **Route:** `/api/account/security/totp/*`
- **Rolle:** Administrator / Nutzer
- **Schweregrad:** Hoch
- **Status:** Teilweise
- **Beschreibung:** TOTP-Backend und Login-Flow vorhanden; keine UI-Komponente im Mitgliederbereich für Setup/Disable gefunden.
- **Reproduktion:** Account-Bereich durchsuchen nach TOTP-UI
- **Erwartet:** Nutzer kann 2FA im Konto aktivieren
- **Tatsächlich:** Nur API-Routen
- **Dateien:** `app/api/account/security/totp/`, Login-Route
- **Empfehlung:** Account-Sicherheitsseite ergänzen
- **Produktionsblocker:** Ja (Admin-2FA-Pflicht dokumentiert)

### AW-TEST-012
- **Bereich:** Blog
- **Route:** `/admin/magazin`, Blog-APIs
- **Rolle:** Administrator
- **Schweregrad:** Mittel
- **Status:** Nicht vollständig getestet
- **Beschreibung:** `test-blog-system.cjs` schlug fehl („Admin-Login: Login fehlgeschlagen“) — End-to-End Blog-Admin-Flow in dieser Session nicht verifiziert.
- **Reproduktion:** Skript mit gültigen Admin-Credentials ausführen
- **Erwartet:** Artikel CRUD + Veröffentlichung
- **Tatsächlich:** Struktur vorhanden, Praxistest offen
- **Dateien:** `scripts/test-blog-system.cjs`
- **Empfehlung:** Manueller Admin-Durchlauf mit Credentials
- **Produktionsblocker:** Nein (unklar)

### AW-TEST-013
- **Bereich:** Performance (Dev)
- **Route:** `/`
- **Rolle:** Gast
- **Schweregrad:** Mittel
- **Status:** Teilweise
- **Beschreibung:** Erster Seitenaufruf nach Serverstart ~9,6 s (Turbopack-Kompilierung); danach ~1,5 s.
- **Reproduktion:** Frischer Dev-Server → `curl /`
- **Erwartet:** Akzeptable Ladezeit in Produktion
- **Tatsächlich:** Dev-only Slow Start; `force-dynamic` auf Startseite
- **Dateien:** `app/(marketing)/page.tsx` (`export const dynamic = "force-dynamic"`)
- **Empfehlung:** Production-Build messen; Caching prüfen
- **Produktionsblocker:** Nein (Dev-spezifisch)

### AW-TEST-014
- **Bereich:** Werkstatt — Zugriff
- **Route:** `/werkstatt/lakerechner`, `/werkstatt/rezeptgenerator`, …
- **Rolle:** Gast
- **Schweregrad:** Niedrig (erwartetes Verhalten)
- **Status:** Funktioniert
- **Beschreibung:** Geschützte Werkstatt-Tools leiten auf Login um (HTTP 307).
- **Reproduktion:** Routen-Check ohne Session
- **Erwartet:** Redirect Login
- **Tatsächlich:** 307
- **Produktionsblocker:** Nein

### AW-TEST-015
- **Bereich:** Social Media
- **Route:** Startseite, externe Links
- **Rolle:** Gast
- **Schweregrad:** Mittel
- **Status:** Fehler (Test)
- **Beschreibung:** `test-social-challenges.cjs`: „Sichere externe Links“ fehlgeschlagen.
- **Reproduktion:** Social-Challenges-Testskript
- **Empfehlung:** Kanal-URLs und `rel`-Attribute prüfen
- **Produktionsblocker:** Nein

### AW-TEST-016
- **Bereich:** Akademie
- **Route:** `/akademie/kurse/beispielkurs`
- **Rolle:** Gast
- **Schweregrad:** Mittel
- **Status:** Prototyp
- **Beschreibung:** Explizite Design-Vorlage mit `placeholder-data`, nicht produktiver Kurs.
- **Dateien:** `app/(marketing)/akademie/kurse/beispielkurs/page.tsx`
- **Produktionsblocker:** Nein (wenn nicht verlinkt)

### AW-TEST-017
- **Bereich:** Footer / Navigation
- **Route:** Footer „Admin“
- **Rolle:** Gast
- **Schweregrad:** Niedrig
- **Status:** Teilweise
- **Beschreibung:** `/admin` im öffentlichen Footer verlinkt; führt für Gäste zu Login (307) — verwirrend aber nicht unsicher.
- **Dateien:** `components/marketing/Footer.tsx`
- **Produktionsblocker:** Nein

### AW-TEST-018
- **Bereich:** Support — Doppelte Pfade
- **Route:** `/mein-bereich/support` vs. `/account/tickets`
- **Rolle:** Mitglied
- **Schweregrad:** Niedrig
- **Status:** Teilweise
- **Beschreibung:** Zwei parallele Ticket-UI-Pfade; Help-Hub verweist auf `/account/tickets`.
- **Produktionsblocker:** Nein

### AW-TEST-019
- **Bereich:** Fehlerseiten
- **Route:** Ungültige URL
- **Rolle:** Gast
- **Schweregrad:** Niedrig
- **Status:** Funktioniert
- **Beschreibung:** `/this-route-should-404` → HTTP 404.
- **Produktionsblocker:** Nein

### AW-TEST-020
- **Bereich:** Sicherheit — Permissions Seed
- **Route:** `/admin/sicherheit`
- **Rolle:** Administrator (granular)
- **Schweregrad:** Mittel
- **Status:** Teilweise
- **Beschreibung:** `admin.security.view` ggf. nicht geseedet (WARN im Security-Test).
- **Empfehlung:** `npx tsx scripts/seed-permission-system.ts` auf Produktions-DB
- **Produktionsblocker:** Nein (Superadmin umgeht)

### AW-TEST-021
- **Bereich:** Stripe Checkout
- **Route:** `/api/checkout`, Webhook
- **Rolle:** Käufer
- **Schweregrad:** Hoch (wenn Webhook fehlt)
- **Status:** Code OK, Konfiguration offen
- **Beschreibung:** 17/17 Stripe-Code-Tests; Checkout blockiert ohne Webhook-Secret. Freischaltung nur über Webhook (korrekt designt).
- **Dateien:** `lib/stripe/`, `app/api/stripe/webhook/route.ts`
- **Produktionsblocker:** Ja (ohne Stripe-Konfiguration)

### AW-TEST-022
- **Bereich:** Testaccounts
- **Route:** —
- **Rolle:** QA
- **Schweregrad:** Hoch (Testhindernis)
- **Status:** Fehlend
- **Beschreibung:** Kein `prisma/seed.ts`; Testuser nur via Scripts dynamisch oder `admin:create`.
- **Empfehlung:** Dokumentierte Testaccounts pro Rolle für Abnahme
- **Produktionsblocker:** Nein

### AW-TEST-023
- **Bereich:** Mobile Darstellung
- **Route:** Alle
- **Rolle:** Gast
- **Schweregrad:** Mittel
- **Status:** Nicht vollständig getestet
- **Beschreibung:** Marketing-Nav hat Hamburger (`Navigation.tsx`); Member-Nav nur horizontal scroll — keine dedizierte Tablet/Smartphone-Prüfung in drei Browsern.
- **Produktionsblocker:** Nein

### AW-TEST-024
- **Bereich:** Hydration / HTML
- **Route:** `/` (historisch)
- **Rolle:** Gast
- **Schweregrad:** Mittel
- **Status:** Bekannt aus Vorgänger-Chat
- **Beschreibung:** `<p>` in `<p>` Hydration-Warnung in PhilosophySection/Testimonials — nicht erneut im Browser verifiziert.
- **Produktionsblocker:** Nein

### AW-TEST-025
- **Bereich:** Benutzergruppen Admin
- **Route:** `/admin/benutzer-rechte/gruppen`
- **Rolle:** Superadmin
- **Schweregrad:** Mittel
- **Status:** Behoben vor Test (Vorgänger-Session)
- **Beschreibung:** Superadmin erhielt zeitweise HTTP 403 auf Groups-API wegen `loadUserContext`-Strenge — in Dev-Session beobachtet, Code-Anpassung erfolgte außerhalb dieses Berichts.
- **Hinweis:** Im reinen Dokumentationsauftrag nicht erneut validiert.
- **Produktionsblocker:** Nein

---

## Automatisierte Routenliste (Auszug)

Skript: `node scripts/acceptance-route-check.cjs` — **47 Routen, 0 Timeouts, 0× 5xx**

| Status | Route |
| ------ | ----- |
| 200 | `/`, `/akademie`, `/rezepte`, `/werkstatt`, `/werkstatt/salzrechner`, `/werkstatt/empfehlungen`, `/community`, `/mitgliedschaft`, `/magazin`, `/hilfe`, Rechtsseiten, Auth-Seiten, `/wartung`, APIs öffentlich |
| 307 | `/mein-bereich`, `/admin/*`, geschützte Werkstatt-Tools |
| 404 | absichtlich ungültige Route |

**Admin-Navigation:** 88 eindeutige Admin-Pfade inventarisiert (Code-Analyse); ohne Login durchweg 307 — Einzelseiten-Inhalte in dieser Session nicht vollständig im Browser mit Admin-Session geprüft.

---

## Testskript-Ergebnisse (Session)

| Skript | Ergebnis |
| ------ | -------- |
| test-db-connection.cjs | OK |
| test-permissions-system.cjs | 21/21 |
| test-security-system.cjs | BESTANDEN (1 WARN Seed) |
| test-stripe-integration.cjs | 17/17 |
| test-help-center.cjs | 20/20 |
| test-social-challenges.cjs | 35/36 |
| test-email-system.cjs | 11/11 (kein Provider) |
| test-legal-system.cjs | 10/11 **FEHL** |
| test-page-editor.cjs | 8/8 |
| test-maintenance-mode.cjs | 9/9 |
| test-forum-permissions.cjs | 9/9 |
| test-community-forums.cjs | 9/9 |
| test-marinade-generator.cjs | 25/25 |
| test-account-privacy-withdrawal.cjs | 9/9 |
| test-analytics.cjs | 22/22 |
| test-blog-system.cjs | **FEHL** (Admin-Login) |
| acceptance-route-check.cjs | 47/47 erreichbar |

---

## Produktionsstart-Checkliste

### Muss vor Produktionsstart erledigt werden
- AW-TEST-002 `/rezepte` an echte Datenbank anbinden oder Seite sperren
- AW-TEST-003 E-Mail-Webhook absichern
- AW-TEST-004 Rechtstext Draft/Publish-Fehler beheben
- AW-TEST-004/008 E-Mail-Provider und `NEXT_PUBLIC_APP_URL` produktiv setzen
- AW-TEST-006 Test-Challenges/Testdaten von Startseite entfernen
- AW-TEST-008 Mitgliedschaftspreise mit Stripe/Checkout vereinheitlichen
- AW-TEST-010 localhost-Fallbacks in ausgehenden Links eliminieren
- AW-TEST-021 Stripe Webhook + Keys Live/Test vollständig konfigurieren
- AW-TEST-011 2FA-UI für Admins (mindestens) bereitstellen
- Server-Stabilität unter Production-Build verifizieren (AW-TEST-001)

### Sollte vor Produktionsstart erledigt werden
- AW-TEST-007 Alle `href="#"` ersetzen
- AW-TEST-009 Admin-Platzhalter (Medien, Navigation) klären
- AW-TEST-012 Blog-Admin End-to-End testen
- AW-TEST-015 Externe Social-Links härten
- AW-TEST-020 Permission-Seed inkl. Security-Views
- Performance-Test Production-Build (AW-TEST-013)
- Mobile/responsive QA (AW-TEST-023)
- Testaccounts-Dokumentation (AW-TEST-022)

### Kann nach Produktionsstart erfolgen
- Newsletter-Marketing-Integration
- Zentrale Medienbibliothek
- Meisteranalyse-Feature (`membership-rules.ts`)
- Komfort: Footer Admin-Link entfernen

---

## Abschließende Empfehlung

1. **Ist die Plattform aktuell produktionsbereit?** **Nein.**
2. **Können echte Nutzer sicher registriert werden?** **Teilweise** — Registrierungsflow strukturell vorhanden, E-Mail-Verifizierung abhängig von Provider; nicht End-to-End mit echter Mail getestet.
3. **Können echte Zahlungen sicher durchgeführt werden?** **Nein** — Stripe-Konfiguration und konsistente Produktpreise fehlen in der Praxis; Code-Seite wirkt solide.
4. **Können Administratoren die Plattform ohne Entwickler verwalten?** **Teilweise** — Umfangreicher Admin (88 Routen), aber Medien/Navigation Platzhalter, Seeds/Cron/ENV nötig.
5. **Gibt es Funktionen, die nur scheinbar fertig sind?** **Ja** — `/rezepte`, Teile `/mitgliedschaft`, Admin-Medien, 2FA-UI, E-Mail-Versand.
6. **Gibt es tote Links oder nicht funktionierende Buttons?** **Ja** — mindestens 4× `#` auf öffentlichen Seiten.
7. **Gibt es fehlende oder unvollständige Adminfunktionen?** **Ja** — siehe Tabelle nicht administrierbarer Funktionen.
8. **Gibt es Sicherheits- oder Datenschutzrisiken?** **Ja** — offener E-Mail-Webhook (kritisch); ansonsten Permissions/Forum/Analytics gut getestet.
9. **Top-5-Prioritäten:** (1) `/rezepte`/Platzhalter-Inhalte, (2) E-Mail-Webhook + Provider, (3) Rechtstext-Bug + Prod-URLs, (4) Stripe/Checkout live-fähig, (5) Testdaten von Startseite + Server-Stabilität.
10. **Kann mit Werbung und zahlenden Kunden begonnen werden?** **Nein** — nicht empfohlen vor Behebung der kritischen Befunde.

---

*Erstellt im Rahmen des rein dokumentierenden Abnahmeauftrags. Keine Fehler wurden im Code behoben. Warte auf ausdrückliche Anweisung zur Behebung einzelner Befunde.*
