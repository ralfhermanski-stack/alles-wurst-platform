# Kontolöschung und Aufbewahrung

## Löschplan (`lib/privacy/account-deletion-service.ts`)

| Kategorie | Aktion | Beispiele |
|-----------|--------|-----------|
| A Sofort löschbar | delete | Avatar, Bio, Marketing |
| B Anonymisieren | anonymize | Foren, Bewertungen, Challenges |
| C Aufbewahren | retain | Rechnungen, Vertragsnachweise |
| D Blockiert | block | Offene Widerrufe, Tickets, Mitgliedschaft |

## Durchführung

- Konto sperren (`accountStatus: deactivated`)
- E-Mail durch interne Kennung ersetzen
- `publicName`: „Gelöschter Benutzer“
- `AccountDataRetention` für Pflichtdaten
- Datenschutz-Ticket Kategorie `datenschutz-loeschung`, Priorität `important`

## Verzögerte Endlöschung

`AccountDataRetention.retentionUntil` — Cron prüft fällige Einträge.

## Blockierende Vorgänge

Status `PARTIALLY_FULFILLED` wenn offene Widerrufe, Tickets, Zahlungen oder Mitgliedschaft.

## Fachlich zu prüfen

- Konkrete Aufbewahrungsfristen je Datenkategorie
- Steuer-/Buchhaltungsfristen
- Foren- und Bewertungs-Anonymisierung

## Produktion

- `LEGAL_CRON_SECRET` für Wartungsjobs setzen
- Löschkategorien vor Go-Live rechtlich prüfen
