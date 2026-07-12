# Marinaden-Generator

Technische Dokumentation für den Marinaden-Generator unter `/werkstatt/marinaden-generator`.

## Überblick

Der Marinaden-Generator ist ein 6-Schritt-Assistent zur Erstellung von Marinaden-Rezepten. Rezepte werden in der bestehenden `recipes`-Tabelle gespeichert mit `recipeKind = marinade` und `payload.recipeKind = "marinade"`.

Bestehende Wurst-Rezepte (`recipeKind = wurst`) bleiben unverändert und werden in Listen des Rezeptgenerators separat gefiltert.

## Rechte & Mitgliedschaft

| Rolle | Zugriff |
|---|---|
| Gast | Kein Zugriff (`marinade.use` verweigert) |
| registered | Demo: Assistent nutzbar, kein Speichern/PDF |
| wurstclub / meisterclub | Vollzugriff: Speichern + PDF |
| admin | Alle Rezepte sehen und bearbeiten (Admin-Liste) |

Capabilities in `lib/membership/membership-rules.ts`:

- `marinade.use` — Generator öffnen
- `marinade.save` — Rezepte speichern/bearbeiten
- `marinade.pdf` — PDF erzeugen und herunterladen

Premium-Datenbankrezepte: `visibility = database` + `isOfficialDatabase` + `moderationStatus = approved` + `recipe.database.read`.

## Datenmodell

### Schema-Erweiterungen (`recipes`)

- `recipeKind`: `wurst` | `marinade` (Default: `wurst`)
- `pdfStorageKey`, `pdfGeneratedAt`, `pdfVersion`, `pdfStatus` (`none` | `current` | `outdated`)

### Payload (`lib/tools/marinade-types.ts`)

JSON in `recipes.payload` mit `recipeKind: "marinade"`, Produkt, Marinadenart, Zutaten (g/kg), Schritte, Hinweise, Warnungen.

## API

| Methode | Route | Beschreibung |
|---|---|---|
| GET | `/api/tools/marinades` | Eigene Marinaden listen |
| POST | `/api/tools/marinades` | Neue Marinade anlegen |
| GET | `/api/tools/marinades/[id]` | Einzelrezept laden |
| PATCH | `/api/tools/marinades/[id]` | Aktualisieren (PDF → `outdated`) |
| DELETE | `/api/tools/marinades/[id]` | Soft-Delete |
| POST | `/api/tools/marinades/[id]/duplicate` | Duplizieren |
| POST | `/api/tools/marinades/[id]/pdf` | PDF serverseitig erzeugen |
| GET | `/api/tools/marinades/[id]/pdf` | Geschützter PDF-Download |

PDF-Downloads erfolgen **nur** über die API mit Session/Rechteprüfung — keine öffentlichen Storage-URLs.

## Frontend

- `/werkstatt/marinaden-generator` — Übersicht
- `/werkstatt/marinaden-generator/neu` — Neuer Assistent
- `/werkstatt/marinaden-generator/[id]` — Bearbeiten

Komponenten unter `components/tools/marinade-generator/`.

## PDF

Serverseitige Erzeugung mit `pdfkit`, Speicherung unter `storage/recipe-pdfs/{recipeId}/`. Bei Rezeptänderung wird `pdfStatus` auf `outdated` gesetzt.

## Migration

```bash
npx prisma migrate deploy
npx prisma generate
```

Migration: `prisma/migrations/20260709193000_marinade_generator/migration.sql`

## Tests

```bash
node scripts/test-marinade-generator.cjs
```

## Manuelle Test-Checkliste

1. Als Gast: `/werkstatt/marinaden-generator` → gesperrt
2. Als registered: Demo-Modus, Speichern blockiert
3. Als wurstclub: Rezept anlegen, Gewicht ändern → Skalierung prüfen
4. Zutat hinzufügen/löschen
5. Speichern, erneut öffnen, bearbeiten
6. PDF erzeugen und über API herunterladen
7. Nach Änderung: PDF-Status `outdated`
8. Admin: Filter `recipeKind=marinade`
9. Privates Rezept: nur Besitzer lesbar
10. Datenbankrezept: nur mit `recipe.database.read`
