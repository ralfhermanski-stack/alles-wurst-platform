# Datenschutz-Center

## Route

`/account/datenschutz`

## Bereiche

1. Übersicht — gespeicherte Datenkategorien
2. Datenexport — `DataExportRequest`, ZIP in `storage/data-exports/`
3. Datenschutzanfragen — `PrivacyRequest`
4. Kontolöschung — zweistufiger Workflow

## Exportworkflow

1. „Meine Daten anfordern“ im Datenschutz-Center
2. E-Mail mit Einmal-Token (Hash gespeichert, 45 Min.) zur Identitätsbestätigung
3. E-Mail-Link öffnet `/account/datenschutz/export-bestaetigen?token=`
4. Nach Bestätigung: Export als ZIP (JSON + HTML + PDF), Status `READY`
5. E-Mail mit signiertem Download-Link (7 Tage gültig)
6. Download im Konto (Button) oder per E-Mail-Link

**ZIP-Inhalt:** `daten.json`, `uebersicht.html`, `uebersicht.pdf`

## Löschworkflow

1. Passwort + Checkbox „Löschung beantragen“
2. E-Mail mit Einmal-Token (Hash gespeichert, 45 Min.)
3. E-Mail-Link öffnet `/account/datenschutz/loeschung-bestaetigen?token=`
4. Finale Bestätigung per POST → `UNDER_REVIEW` + Löschplan

**Wichtig:** GET des E-Mail-Links setzt nur `emailConfirmedAt`, keine Löschung.

## Admin

`/admin/datenschutz` — Anfragen, Exporte, Löschpläne

## Cron

`POST /api/cron/privacy` (Bearer `LEGAL_CRON_SECRET`):

- Abgelaufene Exporte löschen
- Aufbewahrungsfristen prüfen
- Fehlgeschlagene Vertrags-PDFs erneut versuchen

## APIs

- `GET /api/account/privacy/overview`
- `POST /api/account/privacy/export`
- `GET /api/account/privacy/export/confirm-email`
- `GET /api/account/privacy/export/download?token=`
- `GET /api/account/privacy/export/[exportId]/download`
- `POST /api/account/privacy/deletion/request`
- `GET /api/account/privacy/deletion/confirm-email`
- `POST /api/account/privacy/deletion/final-confirm`

## Textschlüssel

Siehe `lib/platform-text/platform-text-defaults.ts` (Präfix `privacy.*`, `account.orders.*`)
