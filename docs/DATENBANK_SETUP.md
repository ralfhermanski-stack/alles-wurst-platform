# =============================================================================
# docs/DATENBANK_SETUP.md — Lokale Datenbankumgebung (Alles-Wurst 2.0)
# =============================================================================
# Version: 1.0
# Stand: Juli 2026
# Schritt: 1 — Infrastruktur (keine Fachfunktionen)
# =============================================================================

## 1. Übersicht

Alles-Wurst 2.0 nutzt **PostgreSQL** als Datenbank und **Prisma** als ORM (Object-Relational Mapping). In Schritt 1 ist nur die Infrastruktur vorbereitet:

| Komponente | Datei / Ort |
|------------|-------------|
| PostgreSQL (Docker) | `docker-compose.yml` |
| Umgebungsvariablen | `.env` (lokal), `.env.example` (Vorlage) |
| Prisma-Schema | `prisma/schema.prisma` |
| Prisma-Client | `lib/db/prisma.ts` |
| Verbindungstest | `scripts/test-db-connection.cjs` |

**Noch nicht enthalten:** Rezept-Tabellen, API, UI-Änderungen, Meisteranalyse.

---

## 2. Voraussetzungen

Auf deinem Rechner müssen installiert sein:

| Software | Zweck | Prüfen |
|----------|-------|--------|
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | PostgreSQL-Container | `docker --version` |
| Node.js 20+ | npm, Prisma CLI | `node --version` |
| npm | Paketverwaltung | `npm --version` |

---

## 3. Ersteinrichtung (einmalig)

### 3.1 Abhängigkeiten installieren

```bash
npm install
```

Installiert u. a. `@prisma/client` und `prisma`. Nach der Installation wird automatisch `prisma generate` ausgeführt (postinstall).

### 3.2 Umgebungsvariablen anlegen

Falls noch keine `.env` existiert:

```bash
# macOS / Linux
cp .env.example .env

# Windows PowerShell
Copy-Item .env.example .env
```

Die Standardwerte passen zu `docker-compose.yml`. Nur anpassen, wenn du andere Ports oder Passwörter verwendest.

### 3.3 PostgreSQL starten

```bash
npm run db:up
```

Alternativ direkt:

```bash
docker compose up -d
```

Der Container heißt `alles-wurst-postgres` und lauscht auf Port **5432**.

**Status prüfen:**

```bash
docker compose ps
```

Erwartung: Status `healthy` (nach wenigen Sekunden).

### 3.4 Datenbankschema anlegen (erste Migration)

```bash
npm run db:migrate
```

Beim ersten Lauf fragt Prisma nach einem Migrationsnamen — Enter drücken oder z. B. `init_connection_test` eingeben.

Das legt die Tabelle `connection_test` an (nur technischer Verbindungstest).

### 3.5 Verbindung testen

```bash
npm run db:test
```

Erwartete Ausgabe:

```
--- Alles-Wurst 2.0: Datenbank-Verbindungstest ---
Verbindung hergestellt.
Testeintrag geschrieben:
  id:        ...
  message:   connection-ok
  checkedAt: ...
--- Verbindungstest erfolgreich ---
```

---

## 4. Tägliche Entwicklung

### 4.1 Datenbank starten / stoppen

```bash
# Starten (Hintergrund)
npm run db:up

# Stoppen (Daten bleiben im Docker-Volume erhalten)
npm run db:down
```

### 4.2 Prisma Studio (grafische DB-Ansicht)

```bash
npm run db:studio
```

Öffnet einen Browser mit Tabellenansicht — nützlich zum Inspizieren von `connection_test`.

### 4.3 Nach Schema-Änderungen

Wenn `prisma/schema.prisma` geändert wird (in späteren Schritten):

```bash
# 1. Migration erstellen und anwenden (Entwicklung)
npm run db:migrate

# 2. TypeScript-Client neu generieren (passiert auch bei migrate dev)
npm run db:generate
```

---

## 5. npm-Skripte (Referenz)

| Befehl | Beschreibung |
|--------|--------------|
| `npm run db:up` | PostgreSQL-Container starten |
| `npm run db:down` | PostgreSQL-Container stoppen |
| `npm run db:migrate` | Migration erstellen/anwenden (`prisma migrate dev`) |
| `npm run db:generate` | Prisma Client neu generieren |
| `npm run db:studio` | Prisma Studio öffnen |
| `npm run db:test` | Technischen Verbindungstest ausführen |

---

## 6. Prisma — wie es verwendet wird

### 6.1 Schema (`prisma/schema.prisma`)

Definiert Tabellen, Felder und Beziehungen. Prisma übersetzt das Schema in:

- SQL-Migrationen (`prisma/migrations/`)
- TypeScript-Typen und Client (`node_modules/.prisma/client`)

### 6.2 Client (`lib/db/prisma.ts`)

Zentraler Einstiegspunkt für Datenbankzugriffe in der App:

```typescript
import { prisma } from "@/lib/db/prisma";

// Beispiel (ab späteren Schritten — noch nicht in der App eingebunden):
const tests = await prisma.connectionTest.findMany();
```

**Wichtig:** Nur serverseitig verwenden (API-Routen, Server Actions). Nicht in Client-Komponenten importieren.

### 6.3 Migrationen — Entwicklung vs. Produktion

| Umgebung | Befehl | Wann |
|----------|--------|------|
| Lokal (Entwicklung) | `npx prisma migrate dev` | Nach jeder Schema-Änderung |
| Staging / Produktion | `npx prisma migrate deploy` | Beim Deployment (nur anwenden, nicht interaktiv) |

**Ablauf bei neuen Tabellen (z. B. `recipes` in Schritt 2):**

1. Modell in `prisma/schema.prisma` ergänzen
2. `npm run db:migrate` — erzeugt SQL-Datei in `prisma/migrations/`
3. Migration committen (SQL-Dateien gehören ins Git)
4. `npm run db:generate` — Client aktualisieren (bei `migrate dev` automatisch)

### 6.4 Verzeichnisstruktur

```
prisma/
├── schema.prisma              ← Schema-Definition
└── migrations/
    ├── migration_lock.toml    ← DB-Typ (postgresql)
    └── YYYYMMDDHHMMSS_name/
        └── migration.sql      ← Generiertes SQL (versioniert)
```

---

## 7. Verbindungsdaten (lokal)

| Parameter | Wert |
|-----------|------|
| Host | `localhost` |
| Port | `5432` |
| Datenbank | `alles_wurst` |
| Benutzer | `alles_wurst` |
| Passwort | `alles_wurst_dev` |
| Schema | `public` |

**DATABASE_URL:**

```
postgresql://alles_wurst:alles_wurst_dev@localhost:5432/alles_wurst?schema=public
```

---

## 8. Fehlerbehebung

### Port 5432 bereits belegt

Ein anderer PostgreSQL-Dienst läuft bereits. Optionen:

- Anderen Dienst stoppen, oder
- In `docker-compose.yml` Port ändern (z. B. `"5433:5432"`) und `DATABASE_URL` anpassen

### `Can't reach database server`

1. Container läuft? → `docker compose ps`
2. `.env` vorhanden und korrekt? → mit `.env.example` vergleichen
3. Container neu starten → `npm run db:down && npm run db:up`

### `Prisma Client did not initialize yet`

```bash
npm run db:generate
```

### Migration schlägt fehl

```bash
# Status prüfen
npx prisma migrate status

# In der Entwicklung: Datenbank zurücksetzen (ACHTUNG: löscht alle Daten)
npx prisma migrate reset
```

---

## 9. Nächste Schritte (Roadmap)

| Schritt | Inhalt |
|---------|--------|
| **1 (aktuell)** | Docker, Prisma, Verbindungstest |
| 2 | `recipes`-Tabelle + Migration (siehe `REZEPTGENERATOR_DATENMODELL.md`) |
| 3 | API CRUD für Rezepte |
| 4 | Rezeptgenerator-UI |

---

## 10. Referenzen

- [Prisma Dokumentation](https://www.prisma.io/docs)
- [PostgreSQL Docker Hub](https://hub.docker.com/_/postgres)
- `docs/REZEPTGENERATOR_DATENMODELL.md` — Fachliches Datenmodell (Version 1.1)
- `docs/PFLICHTENHEFT.md` — Zielarchitektur PostgreSQL + Prisma
