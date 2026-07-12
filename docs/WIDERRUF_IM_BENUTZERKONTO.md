# Widerruf im Benutzerkonto

## Architektur

- **Bestellungen:** `AccountingPosition` als führende Bestell-Entität
- **Widerruf:** bestehendes `WithdrawalRequest`-Modell, Quelle `USER_ACCOUNT`
- **Tickets:** `SupportTicket` mit Kategorie `widerruf`, Priorität `urgent`
- **Bestellbezug:** HMAC-signierter Token (`lib/account/secure-order-token.ts`, 30 Min.)

## Ablauf

1. Nutzer öffnet `/mein-bereich/bestellungen/[orderId]`
2. Bei geeigneter Bestellung: Button „Vertrag widerrufen“
3. Link zu `/widerrufsformular?order=<token>`
4. Formular mit Vorausfüllung, Bestätigungsschritt, Absenden
5. `submitAccountWithdrawal` erstellt Widerruf (Status `RECEIVED`)
6. Automatisches Ticket (höchste Priorität: `urgent`)
7. Account-Nachricht + E-Mail-Eingangsbestätigung

## Sicherheit

- Token nur für eingeloggten Besitzer gültig
- Keine automatische Rückzahlung oder Kursentzug
- Serverseitige Eligibility-Prüfung in `account-order-service.ts`

## APIs

- `GET /api/legal/withdrawal/prefill?token=`
- `POST /api/legal/withdrawal/account`
- `POST /api/legal/withdrawal` (öffentliches Formular)

## Berechtigungen

- Nutzer: nur eigene Bestellungen
- Admin: `/admin/inhalte/rechtliches/widerrufe`

## Tests

`node scripts/test-account-privacy-withdrawal.cjs`
