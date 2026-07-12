# Rechtstexte & Widerruf — Praxistest-Checkliste

| # | Testpunkt | Erwartetes Ergebnis | Tatsächliches Ergebnis | Bestanden | Bemerkung |
|---|-----------|---------------------|------------------------|-----------|-----------|
| 1 | Impressum aufrufen (`/impressum`) | Seite lädt, neutraler Hinweis wenn nicht veröffentlicht | | ☐ | |
| 2 | Datenschutz aufrufen | Wie oben | | ☐ | |
| 3 | AGB aufrufen | Veröffentlichte Version sichtbar | | ☐ | |
| 4 | Widerrufsbelehrung aufrufen | Dokument oder Hinweis | | ☐ | |
| 5 | Widerrufsformular aufrufen | Formular sichtbar, kein Pflichtfeld „Grund“ | | ☐ | |
| 6 | Cookie-Einstellungen aufrufen | Consent-UI + Cookie-Richtlinie | | ☐ | |
| 7 | Footer prüfen | Alle Rechtslinks vorhanden | | ☐ | |
| 8 | Mobilansicht | Kein horizontales Scrollen | | ☐ | |
| 9 | Externes Dokument synchronisieren | Neue Version oder „unchanged“ | | ☐ | Admin |
| 10 | Neue Version prüfen | Status PENDING_REVIEW oder PUBLISHED | | ☐ | |
| 11 | Alte Version wiederherstellen | Publish älterer Version | | ☐ | |
| 12 | Anbieter-Ausfall simulieren | Letzte Version bleibt sichtbar | | ☐ | |
| 13 | Checkout ohne Sofortzustimmung | Bestellung möglich, DELAYED Access | | ☐ | |
| 14 | Verzögerte Kursfreischaltung | pendingAccessUntil gesetzt | | ☐ | |
| 15 | Checkout mit Sofortzustimmung | IMMEDIATE Access nach Zahlung | | ☐ | |
| 16 | Dokumentierter Kurszugang | PurchaseLegalRecord vorhanden | | ☐ | |
| 17 | Vertragsbestätigung (E-Mail) | Bestelldaten + Zustimmungen | | ☐ | PDF noch offen |
| 18 | Widerruf absenden | Vorgangsnummer + Eingang | | ☐ | |
| 19 | Adminbearbeitung | Status änderbar | | ☐ | |
| 20 | Stripe-Rückzahlung (Test) | Nur manuell durch Admin | | ☐ | |
| 21 | Benutzerbestätigung Widerruf | E-Mail (wenn konfiguriert) | | ☐ | |

**Legende:** Bestanden = ja/nein

**Automatisierte Tests:** `node scripts/test-legal-system.cjs` (11 Tests)
