# Support-Ticketsystem — Testanleitung

## Voraussetzungen

- Dev-Server: `npm run dev` (http://localhost:3000)
- Datenbank synchron: `npx prisma db push` und `npx prisma generate`
- Admin-Konto vorhanden (z. B. `ralf.hermanski@alles-wurst.de`)

## Automatische Tests

```bash
node scripts/test-support-tickets.cjs
```

## Manueller Test — Userbereich

1. Als normaler User anmelden
2. **Mein Bereich → Support** (`/mein-bereich/support`)
3. **Neues Ticket** erstellen:
   - Betreff, Kategorie, Priorität, Nachricht
   - optional Anhang (JPG/PNG/PDF, max. 10 MB)
4. Ticket-Detail öffnen — Verlauf wie Unterhaltung
5. Auf Staff-Antwort warten (siehe Admin-Test) — Badge „neu“ im Posteingang
6. Antwort senden, optional **Als erledigt markieren**
7. Nach Schließen: Bewertung abgeben (1–5 Sterne)

## Manueller Test — Admin/Support

1. Als Admin anmelden → **Admin → Support** (`/admin/support`)
2. Dashboard prüfen: offen, in Bearbeitung, überfällig, Rückfragen
3. Filter/Suche testen (Status, Priorität, Kategorie, Bearbeiter)
4. Ticket öffnen (`/admin/support/AW-T-…`)
5. **Öffentliche Antwort** senden (erscheint im User-Posteingang)
6. **Interne Notiz** hinzufügen (User sieht sie nicht)
7. **Bearbeiter zuweisen/weiterreichen** mit optionalem internen Kommentar
8. Status ändern (z. B. „Rückfrage an User“)
9. **Antwortvorlagen** unter `/admin/support/vorlagen` anlegen
10. **CSV-Export** über Button in der Übersicht
11. Optional: **Anonymisieren** (nur Admin)

## Support-Rolle testen

1. User auf `systemRole = SUPPORT` setzen (Admin → Benutzer)
2. Als Support anmelden → Zugriff auf `/admin/support` (nicht auf restlichen Admin)
3. Zugewiesene Tickets bearbeiten

## Automatismen (Eskalation)

Beim Laden der Admin-Übersicht laufen Hintergrundregeln:

| Regel | Aktion |
|-------|--------|
| 24h offen ohne Bearbeiter | Admin-Hinweis / Event |
| 48h ohne Antwort | Markierung „überfällig“ |
| 7 Tage Rückfrage ohne User-Antwort | Erinnerung im Userbereich |
| 7 Tage nach „Gelöst“ | Automatisches Schließen |

## Rechte

- User: nur eigene Tickets
- Support: zugewiesene Tickets (+ alle bei Admin-Rolle)
- Admin: alles inkl. Anonymisierung, Kategorien, Vorlagen

## Sicherheit

- Keine öffentlichen Ticket-URLs ohne Login
- Anhänge nur über authentifizierte API (`/api/support/attachments/[id]`)
- Session-Cookie + serverseitige Rollenprüfung bei jeder Aktion
