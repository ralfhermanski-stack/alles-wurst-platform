# Rechtstexte-System — Technische Dokumentation

## Architektur

Das Rechtstexte-System trennt **kurze UI-Texte** (Plattform-Textverwaltung) von **langen Rechtsdokumenten** (eigene Verwaltung mit Versionierung).

```
Externer Anbieter → Sync-Service → LegalDocumentVersion → öffentliche Route
Checkout → CheckoutLegalConsent → PurchaseLegalRecord → CourseAccess (pending|active)
Widerrufsformular → WithdrawalRequest → Admin-Prüfung → ggf. Stripe-Refund (manuell)
```

## Datenmodelle (Prisma)

- `LegalDocument` — Metadaten, Status, Sync-Zeitpunkte
- `LegalDocumentVersion` — Inhalt, Prüfsumme, Veröffentlichungsstatus
- `LegalDocumentSyncLog` — Sync-Protokoll
- `LegalDocumentCredential` — verschlüsselte API-Zugänge
- `CheckoutLegalConsent` — Checkbox-Zustimmungen pro Checkout
- `PurchaseLegalRecord` — Snapshot beim Kauf
- `WithdrawalRequest` — digitale Widerrufsanfragen

## Öffentliche Routen

| Route | Dokumenttyp |
|-------|-------------|
| `/impressum` | IMPRINT |
| `/datenschutz` | PRIVACY_POLICY |
| `/agb` | TERMS_AND_CONDITIONS |
| `/widerrufsbelehrung` | WITHDRAWAL_POLICY |
| `/widerrufsformular` | Formular + Hinweise |
| `/cookie-einstellungen` | COOKIE_POLICY + Consent-UI |
| `/rechtliches` | Übersicht |

## Synchronisierung

- Service: `lib/legal/legal-document-sync-service.ts`
- Manuell: Admin → Rechtliches → Synchronisierung
- Cron: `POST /api/cron/legal-documents` mit `Authorization: Bearer $LEGAL_CRON_SECRET`
- Bei Fehler: letzte **veröffentlichte** Version bleibt öffentlich sichtbar

## Sicherheit

- HTML-Sanitizing (`lib/legal/legal-html-sanitize.ts`): kein `<script>`, kein `<iframe>` (öffentlich)
- SSRF-Schutz bei externen Abrufen (`lib/legal/legal-external-fetch.ts`)
- API-Keys verschlüsselt (`LEGAL_CREDENTIALS_KEY`)
- Admin-APIs nur mit Admin-Session
- Cron nur mit Bearer-Secret (min. 32 Zeichen)

## Checkout & Kursfreischaltung

- AGB + Datenschutz: Pflicht, nicht vorausgewählt
- Digitale Kurse: zwei **getrennte** Checkboxen für Sofortbereitstellung (Platzhaltertexte!)
- Ohne beide Zustimmungen: `accessMode = DELAYED`, `pendingAccessUntil = now + 14 Tage`
- Mit beiden Zustimmungen: `accessMode = IMMEDIATE`
- **Kursfortschritt allein führt nicht zur automatischen Widerrufsablehnung**

## Widerruf

- Öffentliches Formular unter `/widerrufsformular`
- API: `POST /api/legal/withdrawal`
- Vorgangsnummer `WR-YYYYMMDD-XXXXXX`
- Admin: `/admin/inhalte/rechtliches/widerrufe`
- Keine automatische Rückzahlung beim Formularversand

## Tests

```bash
node scripts/test-legal-system.cjs
```

## Produktionseinrichtung

1. Rechtstexte beim Anbieter einrichten
2. Externe URLs / API-Zugänge im Admin hinterlegen
3. Dokumente importieren und veröffentlichen
4. `LEGAL_CRON_SECRET` und `LEGAL_CREDENTIALS_KEY` setzen
5. Täglichen Cron für `/api/cron/legal-documents` planen
6. **Rechtliche Prüfung** vor Livegang (siehe `RECHTLICHE_PRUEFPUNKTE_VOR_LIVEGANG.md`)

## Bekannte Einschränkungen

- Bestätigungs-E-Mail enthält noch keine PDF-Anhänge der Rechtstexte
- Versions-Diff-Ansicht im Admin ist noch minimal
- Stripe-Refund muss manuell im Admin dokumentiert werden
- Checkbox-Wortlaute sind technische Platzhalter
