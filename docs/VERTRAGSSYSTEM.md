# Vertragssystem und Kaufbestätigung

Stand: Juli 2026

## Übersicht

Das Vertragssystem dokumentiert jeden kostenpflichtigen Kauf revisionssicher: Checkout-Zustimmungen, Vertragsbestätigung im Konto, archivierte PDFs und Freischaltungslogik abhängig von den Widerrufserklärungen.

## Checkout — Pflicht-Erklärungen

Vor Abschluss einer kostenpflichtigen Bestellung (Kurse, Workshops, **Mitgliedschaften**) werden abgefragt:

1. **AGB** (Checkbox, Pflicht)
2. **Datenschutzerklärung** (Checkbox, Pflicht)
3. **Sofortige Bereitstellung** (Ja/Nein, Pflicht bei digitalen Inhalten)
4. **Kenntnis Widerrufsverlust** (Ja/Nein, Pflicht bei digitalen Inhalten)

Texte: `lib/legal/legal-consent-texts.ts` (Version `checkout-consent-v2`)

UI: `components/legal/CheckoutLegalSection.tsx`

## Freischaltungslogik

| Beide Ja | Ergebnis |
|----------|----------|
| Ja + Ja | Sofortige Freischaltung (`accessMode: IMMEDIATE`) |
| Nein (eine oder beide) | Keine Sofortfreischaltung (`accessMode: DELAYED`, 14 Tage) |

**Kurse:** `courseAccess.status = pending` bis Cron-Freischaltung  
**Mitgliedschaften:** `membership.accessBlocked = true` bis Cron-Freischaltung

Cron: `POST /api/cron/legal-documents` → `activateDueDelayedAccess()`

## Revisionssichere Speicherung

| Daten | Speicherort |
|-------|-------------|
| Zeitpunkt | `CheckoutLegalConsent.createdAt`, `PurchaseLegalRecord.recordedAt` |
| Benutzer-ID | `PurchaseLegalRecord.userId` |
| Bestellnummer | `PurchaseLegalRecord.orderNumber` |
| IP (gehasht) | `PurchaseLegalRecord.clientIpHash` |
| User-Agent (gehasht) | `PurchaseLegalRecord.userAgentHash` |
| Produkt | `PurchaseLegalRecord.productName`, `productSlug` |
| Mitgliedschaft | `PurchaseLegalRecord.membershipRole` |
| AGB/Datenschutz/Widerruf Version | `termsVersionId`, `privacyVersionId`, `withdrawalPolicyVersionId` + Checksums |
| Consent-Snapshot | `PurchaseLegalRecord.consentSnapshot` (JSON) |

Der `PurchaseLegalRecord` wird **beim Checkout-Intent** angelegt (nicht erst bei Zahlung), damit der Zustimmungszeitpunkt revisionssicher ist.

## Stripe

Consent-Metadaten in der Checkout Session:

- `access_mode`, `immediate_access`, `withdrawal_loss_ack`
- `consent_version`, `terms_checksum`

Datei: `lib/stripe/stripe-metadata.ts`

## Vertragsbestätigung (Konto)

Route: `/mein-bereich/bestellungen/[orderId]`

- UI: `components/account/ContractConfirmationPanel.tsx`
- Daten: `lib/legal/contract-confirmation-service.ts`

Enthält: Vertragspartner, Vertragsgegenstand, Leistungsumfang, Zahlungsinfos, Widerruf (Fall A/B), Vertragsunterlagen-Downloads, Schlussformel.

## PDF-Erzeugung

- Vertragsbestätigung: `lib/legal/contract-pdf-renderer.ts`
- Rechtstexte + Archivierung: `lib/account/order-legal-document-service.ts`
- Speicher: `lib/account/order-legal-document-storage.ts`

PDFs sind nach Generierung unveränderbar archiviert (`OrderLegalDocument` + Storage-Key).

## Audit — Stand vor Überarbeitung

| Prüfpunkt | Vorher | Jetzt |
|-----------|--------|-------|
| Widerrufs-Checkboxen bei Mitgliedschaft | Nein | Ja (Ja/Nein) |
| Korrekte Speicherung | Teilweise (Membership hardcoded false) | Ja, beim Checkout |
| Auswertung im Kaufprozess | Nur Kurse | Kurse + Mitgliedschaften |
| Stripe-Metadaten | Keine Consents | Consent-Felder |
| Vertragsbestätigung UI | Technische Bestelldaten | Professionelle Vertragsbestätigung |
| IP revisionssicher | Nein | Ja (gehasht) |
| Document Version IDs | Nie befüllt | Beim Checkout befüllt |

## Migration

```bash
npx prisma migrate deploy
npx prisma generate
```

Migration: `20260712210000_contract_system_evidence`

## Rechtlicher Hinweis

Consent-Texte sind technische Vorlagen — vor Livegang rechtlich prüfen lassen (`docs/RECHTLICHE_PRUEFPUNKTE_VOR_LIVEGANG.md`).
