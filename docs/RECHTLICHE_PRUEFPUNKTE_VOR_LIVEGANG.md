# Rechtliche Prüfpunkte vor Livegang

> **Wichtig:** Cursor erfindet keine Rechtstexte und ersetzt keine Rechtsberatung. Alle Punkte unten müssen durch einen Rechtsanwalt oder den Rechtstexte-Anbieter geprüft werden.

## Offene fachliche Prüfung

- [ ] Einordnung der Kurse als digitale Inhalte oder digitale Dienstleistungen
- [ ] Formulierung der Widerrufsbelehrung
- [ ] Formulierung der Checkout-Checkboxen (Sofortbereitstellung + Widerrufsverlust)
- [ ] Voraussetzungen für sofortige Bereitstellung digitaler Inhalte
- [ ] Behandlung von Mitgliedschaften (`MEMBERSHIP`)
- [ ] Behandlung von Live-Workshops (`LIVE_SERVICE`)
- [ ] Wertersatzfragen bei begonnener Leistung
- [ ] Rückerstattungslogik und Fristen
- [ ] Nachweisdaten (IP, User-Agent — datensparsam!)
- [ ] Aufbewahrungsfristen für Kauf- und Widerrufsnachweise
- [ ] Pflichtangaben im Impressum (§ 5 DDG)
- [ ] Datenschutzerklärung (alle eingesetzten Systeme)
- [ ] Cookie-Einwilligungen (Analytics, Marketing, externe Medien)
- [ ] Rechtmäßigkeit externer Einbettungen (YouTube, Social Media)
- [ ] Anforderungen des gewählten Rechtstexte-Anbieters

## Technische Daten für den Rechtstexte-Anbieter

Die Plattform nutzt u. a.:

| Bereich | System |
|---------|--------|
| Benutzerkonten | Eigene Auth, Profile |
| Kurse & Zertifikate | Kursplattform, PDF-Zertifikate |
| Mitgliedschaften | Wurstclub, Meisterclub |
| Zahlungen | Stripe, Überweisung, manuell |
| E-Mail | SMTP/Nodemailer |
| Forum & Community | Eigene Foren |
| Support | Ticket-System |
| Bewertungen | Kursbewertungen |
| Social Media | YouTube-Sync, manuelle Kanäle |
| Challenges | Challenge-System |
| Analytics | Consent-gesteuert |
| Cookies | Consent-Banner + Einstellungsseite |
| Datei-Uploads | Medien, Avatare, Kursmaterial |
| Serverlogs | Hosting/Next.js |
| Datenexport / Kontolöschung | Admin-Funktionen |

Diese Liste dem Rechtstexte-Anbieter zur Erstellung der Datenschutzerklärung übergeben.

## Platzhalter im System

Folgende Texte sind **technische Platzhalter** und müssen ersetzt werden:

- Checkout-Checkboxen in `lib/legal/legal-consent-texts.ts`
- Unveröffentlichte Rechtsseiten zeigen neutralen Hinweis + Kontakt

## Freigabe-Checkliste Admin

- [ ] Alle Pflichtdokumente veröffentlicht (`PUBLISHED`)
- [ ] Footer-Links funktionieren
- [ ] Checkout blockiert ohne veröffentlichte AGB
- [ ] Widerrufsformular erreichbar
- [ ] Cron-Secret gesetzt und getestet
