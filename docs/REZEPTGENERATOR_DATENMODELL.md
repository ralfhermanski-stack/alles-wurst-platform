# Rezeptgenerator – Datenmodell (Konzept)

> **Version:** 1.1  
> **Status:** Freigegeben · Stand: Juli 2026  
> **Zweck:** Daten, Tabellen und Beziehungen für den Rezeptgenerator/Rezeptrechner festlegen.  
> **Bezug:** `docs/DATENMODELL.md` (§8.3 Recipe), `docs/PFLICHTENHEFT.md` (§4.4, §4.6), `docs/SEITENSTRUKTUR.md`, `docs/MITGLIEDSCHAFTEN.md`

### Änderungen in Version 1.1

| # | Änderung |
|---|----------|
| 1 | Fleischmodell um Klassifizierung S1–S10 und R1–R5 erweitert (Kernbestandteil) |
| 2 | Gewürze mit wählbarer Bezugsbasis: Fleisch, Brät, Gesamtmasse |
| 3 | Version 1 umfasst Datenbank, Speichern und Laden von Rezepten |
| 4 | Analysen ausschließlich als Snapshots — niemals im Rezept überschreiben |
| 5 | `recipes` ohne Analyse-Felder; beliebig viele Analysen pro Rezept |

---

## 1. Welche Daten der Rezeptgenerator speichern muss

Der Rezeptgenerator ist ein **strukturierter Rezeptrechner**: Nutzer definieren Fleischanteile mit **Technologie-Klassifizierung (S1–S10, R1–R5)**, Schüttung, Gewürze, Hülle, Produktionsschritte und optional ein Räucherprogramm. Das System berechnet daraus live Mengen, Anteile und ein aggregiertes Technologieprofil. Rezepte werden **persistent in der Datenbank** gespeichert und geladen. Die **Meisteranalyse** ist ein separates Modul und speichert Ergebnisse ausschließlich als Snapshots — niemals im Rezept selbst.

### 1.1 Stammdaten (Rezept-Kopf)

| Feld | Beschreibung | Pflicht |
|------|--------------|---------|
| `id` | Eindeutige Rezept-ID (UUID) | ja |
| `userId` | Besitzer (Ersteller) | ja |
| `title` | Rezeptname | ja |
| `description` | Kurzbeschreibung / Notizen | nein |
| `category` | z. B. Rohwurst, Brühwurst, Pökelware | nein |
| `status` | `draft` \| `saved` \| `published` | ja |
| `visibility` | `private` \| `public` (Rezeptdatenbank) | ja |
| `createdAt` / `updatedAt` | Zeitstempel | ja |
| `version` | Versionsnummer bei Änderungen | ja (ab Speicherung) |

### 1.2 Fleisch (Prozentanteile + Klassifizierung)

Fleischsorten mit **Anteil in %** am Gesamtrezept und **Technologie-Klassifizierung**. Die Klassifizierung ist **Kernbestandteil** des Rezeptgenerators: Jede Fleischzeile trägt die Dimensionen S1–S10 (Struktur) und R1–R5 (Räuchern) und fließt in die Live-Berechnung des Rezept-Technologieprofils ein.

Summe Fleisch-% + Schüttung-% = 100 %.

| Feld | Beschreibung | Pflicht |
|------|--------------|---------|
| `meatType` | Bezeichnung (z. B. Schweinebauch) — Katalog oder Freitext | ja |
| `percentage` | Anteil in % (0–100) | ja |
| `classification` | Objekt mit S1–S10 und R1–R5 | ja |
| `classification.S1` … `classification.S10` | Struktur-Dimensionen (z. B. Bindung, Fettanteil, Wasserbindung) | ja |
| `classification.R1` … `classification.R5` | Räucher-Dimensionen (z. B. Rauchintensität, Trocknung, Farbe) | ja |
| `sortOrder` | Reihenfolge in der UI | ja |

**Berechnet (nicht separat persistiert):**

- `weightKg` = `totalWeightKg × percentage / 100`
- `weightedProfile` — gewichteter Beitrag dieser Fleischzeile zum Gesamt-Technologieprofil des Rezepts (aus `percentage` und `classification`)

**Hinweis:** S1–S10 und R1–R5 beziehen sich auf die **einzelne Fleischkomponente**, nicht auf das fertige Rezept. Das Rezept-Profil ergibt sich aus der gewichteten Aggregation aller Fleischzeilen plus ggf. weiterer Faktoren (Schüttung, Gewürze).

### 1.2.1 Aggregiertes Rezept-Technologieprofil (berechnet)

Aus allen Fleischzeilen wird live ein **Rezept-Profil** berechnet und angezeigt — noch ohne Meisteranalyse:

| Feld | Beschreibung |
|------|--------------|
| `structureProfile` | Aggregierte S1–S10-Werte des Rezepts |
| `smokingProfile` | Aggregierte R1–R5-Werte des Rezepts |

Dieses Profil dient als Grundlage für die spätere Meisteranalyse, wird aber **nicht** in `recipes` gespeichert (nur live berechnet oder in Analyse-Snapshots eingefroren).

### 1.3 Schüttung

Bindemittel / Füllstoffe (z. B. Eis, Wasser, Speck) — ebenfalls in **%** am Gesamtrezept.

| Feld | Beschreibung |
|------|--------------|
| `binderType` | Bezeichnung |
| `percentage` | Anteil in % |
| `sortOrder` | Reihenfolge |

Zusätzlich technische Werte in g/kg oder mg/kg (z. B. Nitrit, Ascorbinsäure) — siehe Payload in `DATENMODELL.md`.

### 1.4 Gewürze und Zutaten (g/kg mit Bezugsbasis)

Gewürze und technische Zutaten werden als **Menge pro Kilogramm** einer **Bezugsbasis** erfasst — nicht ausschließlich bezogen auf die Gesamtmasse.

| Feld | Beschreibung | Pflicht |
|------|--------------|---------|
| `ingredientId` | Optional: Referenz Zutatenkatalog | nein |
| `name` | Anzeigename (bei Freitext) | ja |
| `amountPerKg` | Menge in g/kg bezogen auf die gewählte Basis | ja |
| `referenceBasis` | `meat` \| `braet` \| `total` | ja |
| `unit` | Standard `g/kg` | ja |
| `sortOrder` | Reihenfolge | ja |
| `group` | Optional: Salz, Gewürze, Hilfsstoffe | nein |

**Bezugsbasen:**

| Wert | Bedeutung | Berechnungsgrundlage |
|------|-----------|----------------------|
| `meat` | Fleisch | Summe aller Fleischanteile in kg |
| `braet` | Brät | Fleisch + Schüttung (ohne Hülle, ohne Nachbehandlung) |
| `total` | Gesamtmasse | `totalWeightKg` der Charge |

**Berechnet:** absolute Menge = `amountPerKg × basisWeightKg / 1000`, wobei `basisWeightKg` von `referenceBasis` abhängt.

**Version 1:** Alle drei Bezugsbasen sind im Datenmodell und in der Berechnungslogik vorgesehen. In der UI kann die Auswahl schrittweise freigeschaltet werden; Standard in V1: `total` (konsistent mit Salzrechner), Wechsel pro Zutatzeile möglich.

### 1.5 Hülle

| Feld | Beschreibung |
|------|--------------|
| `casingType` | Naturdarm, Kunstdarm, ohne Hülle |
| `caliber` | Optional (mm) |
| `length` | Optional |
| `notes` | Optional |

### 1.6 Herstellung / Produktion

Schritte und Parameter der Herstellung (ohne Räuchern).

| Feld | Beschreibung |
|------|--------------|
| `steps` | Geordnete Liste: Titel, Beschreibung, Dauer, Temperatur |
| `grinding` | Optional: Mahlgrad, Durchläufe |
| `mixing` | Optional: Mischzeit, Endtemperatur |
| `stuffing` | Optional: Abfüllnotizen |
| `resting` | Optional: Reifezeit |
| `cooking` | Optional: Kerntemperatur, Zeit, Medium |
| `notes` | Freitext |

Struktur als **JSON** im Rezept-Payload.

### 1.7 Räucherprogramm (optional)

| Feld | Beschreibung |
|------|--------------|
| `phases` | Heißrauch, Warmrauch, Kalt rauch, Trocknen |
| `temperature` | °C pro Phase |
| `duration` | Minuten/Stunden pro Phase |
| `humidity` | Optional |
| `notes` | Optional |

### 1.8 Berechnungsgrundlage (Rezeptrechner)

| Feld | Beschreibung |
|------|--------------|
| `totalWeightKg` | Ziel-Gesamtgewicht der Charge |
| `meatSharePercent` | Summe Fleisch-% (validiert) |
| `binderSharePercent` | Summe Schüttung-% (validiert) |

**Berechnete Gewichte (nicht persistiert, zur Laufzeit):**

| Feld | Formel |
|------|--------|
| `meatWeightKg` | `totalWeightKg × meatSharePercent / 100` |
| `binderWeightKg` | `totalWeightKg × binderSharePercent / 100` |
| `braetWeightKg` | `meatWeightKg + binderWeightKg` — Bezugsbasis für `referenceBasis: "braet"` |

### 1.9 Meisterwerkstatt (Analyse — nur Meister, separates Modul)

Die Meisteranalyse ist **strikt getrennt** vom Rezeptgenerator. Analyse-Ergebnisse werden **niemals** in der `recipes`-Tabelle gespeichert oder dort überschrieben. Jedes Analyseergebnis ist ein **eigener, unveränderlicher Snapshot**.

| Feld (pro Snapshot) | Beschreibung |
|---------------------|--------------|
| `id` | Snapshot-ID |
| `recipeId` | Zugehöriges Rezept (Referenz, kein Embed) |
| `payloadSnapshot` | Eingefrorener Rezept-Payload zum Analysezeitpunkt |
| `technologyProfile` | Berechnete S1–S10, R1–R5 inkl. Abweichung zum Referenzprofil |
| `totalScore` | Gesamtscore 0–100 |
| `referenceProfileId` | Verglichenes Referenzprofil |
| `notes` | Meister-Notizen |
| `createdAt` | Zeitpunkt der Analyse |

**Regeln:**

1. Ein Rezept kann **beliebig viele** Analyse-Snapshots besitzen (1:n).
2. Snapshots sind **immutable** — nach Erstellung keine Änderung.
3. Änderungen am Rezept **invalidieren keine** bestehenden Snapshots.
4. Kein Feld `analysis_snapshot` oder `analysis_score` in `recipes`.

### 1.10 Mitgliedschaft und Limits

| Stufe | Rezeptgenerator |
|-------|-----------------|
| Basis | Max. 3 gespeicherte Rezepte, kein PDF |
| Premium | Unbegrenzt speichern, PDF |
| Meister | + Rezeptanalyse, Veröffentlichen in Rezeptdatenbank |

---

## 2. Welche Tabellen dafür nötig sind

> **Hinweis:** Version 1 setzt die **`recipes`-Tabelle** (Prisma/PostgreSQL) um — Speichern und Laden sind Grundfunktion. Detaildaten liegen im JSON-`payload`. Die Meisteranalyse nutzt eine **eigene Tabelle** (`recipe_analysis_snapshots`), getrennt vom Rezept.

### 2.1 Kern-Tabellen

| Tabelle | Zweck | Version |
|---------|-------|---------|
| `recipes` | Rezept-Kopf + `payload` (JSON) — **ohne Analyse-Felder** | **V1** |
| `recipe_analysis_snapshots` | Immutable Meisterwerkstatt-Analysen (1:n pro Rezept) | Phase 4 |
| `analysis_references` | Referenzprofile S1–S10, R1–R5 pro Kategorie | Phase 4 |
| `ingredients` | Zutatenkatalog (Gewürze, Hilfsstoffe) | später |
| `meat_types` | Fleischsorten-Katalog inkl. Default-Klassifizierung S/R | später |
| `recipe_categories` | Wurstkategorien (Rohwurst, Brühwurst, …) | V1 (Enum oder Tabelle) |
| `recipe_versions` | Versionierung bei Speichern | Phase 2 |

### 2.2 Tabellen für Rezeptdatenbank & Community (später)

| Tabelle | Zweck |
|---------|-------|
| `recipe_favorites` | Nutzer-Favoriten (n:m User ↔ Recipe) |
| `recipe_copies` | Herkunft beim „In meine Rezepte kopieren“ |
| `recipe_rankings` | Opt-in Rankings für Meisterclub |

### 2.3 `recipes` — Spalten

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → `users` |
| `name` | String | Rezeptname |
| `category` | Enum/String | Wurstkategorie |
| `description` | Text? | Beschreibung |
| `status` | Enum | `draft`, `saved`, `published` |
| `visibility` | Enum | `private`, `public`, `database` |
| `total_weight_kg` | Decimal? | Letztes Ziel-Gesamtgewicht |
| `payload` | JSON | Fleisch (+ Klassifizierung), Schüttung, Gewürze, Hülle, Produktion, Räuchern |
| `published_at` | DateTime? | Veröffentlichung in Datenbank |
| `created_at` | DateTime | |
| `updated_at` | DateTime | |
| `deleted_at` | DateTime? | Soft-Delete |

**Bewusst nicht in `recipes`:** `analysis_snapshot`, `analysis_score` oder vergleichbare Analyse-Felder. Analysen leben ausschließlich in `recipe_analysis_snapshots`.

### 2.4 `payload` — JSON-Struktur (Vorschlag)

```json
{
  "calculation": {
    "totalWeightKg": 10,
    "meatSharePercent": 85,
    "binderSharePercent": 15
  },
  "meats": [
    {
      "meatType": "Schweinebauch",
      "percentage": 70,
      "sortOrder": 1,
      "classification": {
        "S1": 3, "S2": 5, "S3": 4, "S4": 2, "S5": 6,
        "S6": 3, "S7": 4, "S8": 5, "S9": 3, "S10": 4,
        "R1": 2, "R2": 3, "R3": 1, "R4": 4, "R5": 2
      }
    },
    {
      "meatType": "Speck",
      "percentage": 15,
      "sortOrder": 2,
      "classification": {
        "S1": 2, "S2": 7, "S3": 3, "S4": 1, "S5": 5,
        "S6": 2, "S7": 6, "S8": 4, "S9": 2, "S10": 3,
        "R1": 1, "R2": 2, "R3": 2, "R4": 3, "R5": 1
      }
    }
  ],
  "binders": [
    { "binderType": "Eis", "percentage": 15, "sortOrder": 1 }
  ],
  "schuettung": {
    "waterGPerKg": 50,
    "nitriteMgPerKg": 7.5
  },
  "ingredients": [
    {
      "name": "Salz",
      "amountPerKg": 22,
      "referenceBasis": "total",
      "group": "salz",
      "sortOrder": 1
    },
    {
      "name": "Pfeffer",
      "amountPerKg": 2.5,
      "referenceBasis": "meat",
      "group": "gewuerze",
      "sortOrder": 2
    },
    {
      "name": "Nitritpökelsalz",
      "amountPerKg": 7.5,
      "referenceBasis": "braet",
      "group": "hilfsstoff",
      "sortOrder": 3
    }
  ],
  "casing": {
    "casingType": "Schweinedarm",
    "caliberMm": 32
  },
  "production": {
    "steps": [
      { "title": "Mischen", "description": "…", "durationMin": 5, "temperatureC": 2 }
    ],
    "grinding": { "passes": 2, "plateMm": 3 },
    "cooking": { "coreTempC": 72, "durationMin": 45 }
  },
  "smoking": {
    "phases": [
      { "name": "Warmrauch", "temperatureC": 60, "durationMin": 120 }
    ]
  }
}
```

### 2.5 `recipe_analysis_snapshots` (separates Modul, nicht in V1)

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | UUID | PK |
| `recipe_id` | UUID | FK → `recipes` (nur Referenz) |
| `user_id` | UUID | FK → `users` (wer analysiert hat) |
| `reference_id` | UUID | FK → `analysis_references` |
| `payload_snapshot` | JSON | **Immutable** — Rezept-Payload zum Analysezeitpunkt |
| `profile_result` | JSON | Berechnete S1–S10, R1–R5, Abweichungen, Gesamtscore |
| `total_score` | Integer | 0–100 |
| `notes` | Text? | Meister-Notizen |
| `created_at` | DateTime | Erstellzeitpunkt — **kein** `updated_at` (immutable) |

**Kardinalität:** `recipes` 1 → n `recipe_analysis_snapshots`. Kein Überschreiben, kein „letzter Stand“ im Rezept.

### 2.6 `analysis_references`

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | UUID | PK |
| `category` | String | Wurstkategorie |
| `name` | String | Profilname |
| `profile` | JSON | Referenz-Kennlinien S1–S10, R1–R5 |
| `is_default` | Boolean | Standard für Kategorie |

### 2.7 `ingredients` (Katalog, Phase 5)

| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| `id` | UUID | PK |
| `name` | String | Anzeigename |
| `group` | Enum | `salz`, `gewuerze`, `hilfsstoff`, `sonstiges` |
| `default_unit` | String | z. B. `g/kg` |
| `default_reference_basis` | Enum | `meat`, `braet`, `total` |
| `is_active` | Boolean | Im Generator wählbar |

---

## 3. Beziehungen zwischen Rezept, Fleisch, Zutaten, Herstellung und Meisterwerkstatt

### 3.1 Entitätsdiagramm (logisch)

```
User
 └── Recipe (1:n)                          ← V1: Speichern/Laden
       ├── payload.meats[]                 (Fleisch + classification S1–S10, R1–R5)
       ├── payload.binders[]               (Schüttung)
       ├── payload.ingredients[]           (Gewürze + referenceBasis)
       ├── payload.casing                  (Hülle)
       ├── payload.production              (Herstellung)
       ├── payload.smoking                 (Räucherprogramm, optional)
       └── RecipeAnalysisSnapshot (1:n)    ← separates Modul, Phase 4
             └── AnalysisReference (n:1)

Ingredient (Katalog) ←── optional referenziert von payload.ingredients[]
MeatType (Katalog)   ←── optional referenziert von payload.meats[] (+ Default-Klassifizierung)
```

### 3.2 Beziehungsregeln

| Von | Zu | Kardinalität | Beschreibung |
|-----|-----|--------------|--------------|
| User | Recipe | 1:n | Jeder Nutzer besitzt eigene Rezepte |
| Recipe | Fleisch (payload) | 1:n | Mehrere Fleischsorten mit %-Anteilen **und** S1–S10/R1–R5 |
| Recipe | Schüttung (payload) | 1:n | Bindemittel mit %-Anteilen |
| Recipe | Zutaten (payload) | 1:n | Gewürze/Hilfsstoffe mit `referenceBasis` |
| Recipe | Hülle (payload) | 1:1 | Ein Hüllentyp pro Rezept |
| Recipe | Herstellung (payload) | 1:1 | Produktionsschritte als Objekt |
| Recipe | Räuchern (payload) | 0:1 | Optional |
| Recipe | AnalysisSnapshot | 1:n | **Beliebig viele** immutable Snapshots |
| AnalysisSnapshot | AnalysisReference | n:1 | Vergleich mit Kategorie-Profil |
| Recipe | Recipe (Kopie) | n:1 | Herkunft bei „kopieren“ (später) |

### 3.3 Validierungsregeln (Geschäftslogik)

1. **Fleisch + Schüttung:** Summe aller `percentage` in `meats` + `binders` = 100 %.
2. **Fleisch-Klassifizierung:** Jede Zeile in `meats` muss vollständige S1–S10 und R1–R5-Werte haben.
3. **Gewürze:** `amountPerKg` bezieht sich auf `referenceBasis` (`meat`, `braet`, `total`); Salz-/Nitrit-Grenzwerte mit Warnhinweisen.
4. **Brät-Gewicht:** `braetWeightKg` = Fleischgewicht + Schüttungsgewicht (berechnet).
5. **Herstellung:** Mindestens ein Schritt empfohlen; Pflicht in V1: Rezeptname + mindestens eine Fleischzeile mit Klassifizierung.
6. **Meisterwerkstatt:** Snapshots sind immutable; Rezeptänderungen berühren bestehende Snapshots nicht; **keine** Analyse-Daten in `recipes`.
7. **Sichtbarkeit:** `database` nur für Meister; `public` Profil vs. Datenbank getrennt konfigurierbar.

### 3.4 Abgrenzung: Rezeptgenerator vs. Meisterwerkstatt

| Aspekt | Rezeptgenerator (V1) | Meisterwerkstatt (Phase 4) |
|--------|----------------------|----------------------------|
| Zweck | Erstellen, berechnen, **speichern, laden** | Bewerten, vergleichen, ranken |
| Daten | Mutable `payload` in `recipes` | Immutable `payload_snapshot` in eigener Tabelle |
| Analyse im Rezept | **Nein** — niemals | Nur als separate Snapshots |
| Zugang | Basis+ (eingeschränkt) | Meister |
| Route | `/werkstatt/rezeptgenerator/{id}` | `/werkstatt/rezeptgenerator/{id}/analyse` |
| Live | Mengen, Anteile, aggregiertes S/R-Profil | Profil-Vorschau + Snapshot beim Speichern |
| Datenbank | `recipes` (V1) | `recipe_analysis_snapshots` (Phase 4) |

---

## 4. Was in Version 1 umgesetzt wird

Version 1 liefert einen **vollständig nutzbaren Rezeptgenerator** mit Datenbank-Persistenz. Die **Meisteranalyse** ist bewusst ausgeschlossen und folgt in Phase 4.

### 4.1 In Scope (V1)

| Bereich | Inhalt |
|---------|--------|
| Datenbank | Prisma-Schema, `recipes`-Tabelle, Migration |
| API | CRUD: Erstellen, Lesen, Aktualisieren, Löschen (eigene Rezepte) |
| Speichern / Laden | Grundfunktion — Rezepte persistent, Liste + Detail |
| Berechnungsmodul | `lib/tools/recipe-calculator.ts` — Live-Berechnungen |
| Fleischmodell | Bezeichnung + **Klassifizierung S1–S10, R1–R5** pro Zeile |
| Gewürze | g/kg mit `referenceBasis` (`meat`, `braet`, `total`) |
| UI | Wizard unter `/werkstatt/rezeptgenerator` (neu, bearbeiten, liste) |
| Komponenten | Fleisch-%, Klassifizierung, Schüttung, Gewürze, Hülle, Produktion, Räuchern |
| Validierung | Summe 100 %, Pflicht-Klassifizierung, Salz-/Nitrit-Warnungen |
| Ergebnis | Mengen, Anteile, aggregiertes Rezept-Technologieprofil (live) |
| Mitgliedschaft | Limits Basis (max. 3 Rezepte), Premium (unbegrenzt) |
| Typen | TypeScript-Interfaces für Payload und DB-Modell |

### 4.2 Explizit nicht in V1

- Meisterwerkstatt / Rezeptanalyse / `recipe_analysis_snapshots`
- PDF-Export
- Rezeptdatenbank (lesen/veröffentlichen)
- Zutaten- und Fleischkatalog aus DB (Freitext + manuelle Klassifizierung)
- Import/Export JSON
- Kostenabschätzung
- Favoriten, Rankings, Kopieren
- `recipe_versions` (Änderungshistorie)

### 4.3 V1 — Umsetzungsreihenfolge

1. Prisma-Schema `Recipe` + Migration (ohne Analyse-Felder)
2. TypeScript-Typen und Payload-Struktur (`lib/tools/recipe-types.ts`)
3. Berechnungslogik inkl. Fleisch-Klassifizierung und Bezugsbasen (`lib/tools/recipe-calculator.ts`)
4. API-Routen CRUD (`app/api/recipes/…`)
5. UI-Wizard (Schritt für Schritt, eine Sektion pro Schritt)
6. Rezeptliste `/werkstatt/rezeptgenerator` + `/mein-bereich/rezepte`
7. Lint + Build nach jedem Schritt

---

## 5. Was erst später kommt

### 5.1 Phase 2 — Erweiterte Rezeptverwaltung

- `recipe_versions` für Änderungshistorie
- Duplizieren, erweiterte Soft-Delete-Logik
- Rezeptliste mit Filter und Suche

### 5.2 Phase 3 — Export & Rezeptdatenbank

- PDF-Export und Browser-Druck (Premium+)
- Rezeptdatenbank lesen (Premium+)
- Veröffentlichen (Meister)
- Filter: Kategorie, Fleischsorte, Schwierigkeit
- Favoriten, „In meine Rezepte kopieren“

### 5.3 Phase 4 — Meisterwerkstatt (separates Modul)

- `analysis_references` pflegen (Admin)
- `recipe_analysis_snapshots` — **immutable**, beliebig viele pro Rezept
- Live-Analyse-Panel S1–S10, R1–R5
- Vergleich mit Referenzprofil, Gesamtscore
- Meisterclub-Rankings (opt-in)
- Route `/werkstatt/rezeptgenerator/{id}/analyse`
- **Kein** Schreiben von Analyse-Daten zurück in `recipes`

### 5.4 Phase 5 — Erweiterungen

- Zutatenkatalog `ingredients` mit Autocomplete
- Fleischsorten-Katalog `meat_types` mit Default-Klassifizierung S/R
- JSON Import/Export
- Kostenabschätzung (Preise pro Zutat)
- Verknüpfung Salz-/Lakerechner → Rezeptgenerator
- Admin-Moderation Rezeptdatenbank

---

## 6. Getroffene Entscheidungen (Version 1.1)

| # | Frage | Entscheidung |
|---|-------|--------------|
| 1 | Gewürze-Bezugsbasis | Drei Basen: `meat`, `braet`, `total` — pro Zutatzeile wählbar |
| 2 | Fleisch-Klassifizierung | S1–S10 + R1–R5 **pflicht** pro Fleischzeile, Kernbestandteil V1 |
| 3 | Datenbank in V1 | Ja — `recipes` mit Prisma; Speichern/Laden Grundfunktion |
| 4 | Analysen im Rezept | **Nein** — nur in `recipe_analysis_snapshots`, immutable, 1:n |
| 5 | Schüttung im Payload | `binders[]` (%-Zeilen) + `schuettung` (technische g/kg-Werte) |
| 6 | Fleischkatalog in V1 | Freitext + manuelle Klassifizierung; Katalog ab Phase 5 |
| 7 | UI-Struktur | Wizard mit 6–7 Schritten (vgl. SEITENSTRUKTUR) |
| 8 | Standard-Bezugsbasis V1 | `total` als Default, Wechsel pro Zeile möglich |

---

## 7. Referenzen

- Bestehendes Recipe-Modell: `docs/DATENMODELL.md` §8.3, §8.5
- Funktionale Anforderungen: `docs/PFLICHTENHEFT.md` §4.4, §4.6
- Routen: `docs/SEITENSTRUKTUR.md` — `/werkstatt/rezeptgenerator/*`
- Zugangsregeln: `docs/MITGLIEDSCHAFTEN.md`
- Vorbild Implementierung: `lib/tools/salt-calculator.ts`, `lib/tools/brine-calculator.ts`

---

*Version 1.1 — Freigegeben. Grundlage für die Implementierung des Rezeptgenerators.*
