# Vertragsdokumente je Bestellung

## Datenmodell

`OrderLegalDocument` — unveränderlicher Snapshot pro Bestellung und Dokumenttyp:

- AGB, Widerrufsbelehrung, Muster-Widerrufsformular, Vertragsbestätigung
- `checksum`, `versionLabel`, `storageKey`, `sizeBytes`, `mimeType`
- Status: `PENDING` → `GENERATED` / `FAILED`

## Erzeugung

Bei Zahlungsabschluss ruft `payment-fulfillment-service.ts` `generateOrderLegalDocuments()` auf.

PDFs werden einmalig mit PDFKit erzeugt und in `storage/order-legal-documents/` gespeichert.

## Download

`GET /api/account/orders/[orderId]/documents/[documentId]/download`

Prüfungen: Session, Bestellbesitz, Dokumentstatus `GENERATED`.

## Fehlerbehandlung

- Fehlgeschlagene PDFs: Status `FAILED`, Retry via Cron `/api/cron/privacy`
- Kauf/Zahlung werden nicht rückgängig gemacht

## E-Mail

Kaufbestätigung kann PDF-Anhänge oder sichere Downloadlinks enthalten (abhängig vom Mail-Dienst).

## Tests

Siehe `scripts/test-account-privacy-withdrawal-runner.ts`
