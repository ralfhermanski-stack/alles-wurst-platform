# Textverwaltung (Platform Text Management)

Zentrale Verwaltung aller sichtbaren Plattformtexte unter **Admin → Inhalte → Textverwaltung** (`/admin/inhalte/texte`).

## Architektur

| Komponente | Pfad |
|---|---|
| Schema | `platform_texts`, `platform_text_versions`, `platform_text_change_logs` |
| Standardtexte | `lib/platform-text/platform-text-defaults.ts` |
| Service | `lib/platform-text/platform-text-service.ts` |
| Cache | `lib/platform-text/platform-text-cache.ts` (5s TTL) |
| Hardcode-Scan | `lib/platform-text/platform-text-scan.ts` |
| Admin-UI | `components/admin/platform-text/AdminPlatformTextPanel.tsx` |

## Kategorien

`headings`, `buttons`, `menu`, `footer`, `dashboard`, `courses`, `member`, `forum`, `tickets`, `blog`, `forms`, `errors`, `success`, `auth`, `checkout`, `emails`

## Runtime-Nutzung

```ts
import { getPlatformText, getPlatformTextsByCategory } from "@/lib/platform-text/platform-text-service";

const title = await getPlatformText("auth.login.title", "Anmelden");
const footerTexts = await getPlatformTextsByCategory("footer");
```

**Fallback-Kette:** DB-Wert → Default-Registry → übergebener Fallback → Schlüssel

## API

| Route | Beschreibung |
|---|---|
| `GET /api/admin/platform-text` | Liste (Filter: category, search) |
| `PATCH /api/admin/platform-text/[key]` | Text speichern |
| `POST /api/admin/platform-text/[key]/reset` | Standard wiederherstellen |
| `GET /api/admin/platform-text/[key]/versions` | Versionen |
| `GET /api/admin/platform-text/[key]/changelog` | Änderungsprotokoll |
| `GET /api/admin/platform-text/export` | JSON-Export |
| `POST /api/admin/platform-text/import` | JSON-Import |
| `GET /api/admin/platform-text/report` | Hardcode-Report |
| `GET /api/platform-text?keys=a,b,c` | Öffentlicher Lesezugriff |

## Mehrsprachigkeit (vorbereitet)

Feld `locale` (Default: `de`). Weitere Sprachen können später per `locale`-Filter ergänzt werden.

## Migration

```bash
npx prisma migrate deploy
npx prisma generate
```

Migration: `prisma/migrations/20260710103000_platform_text_management/`

## Tests

```bash
node scripts/test-platform-text.cjs
```

## Bereits integriert

- Footer (`components/marketing/Footer.tsx`)
- Login-Seite (`app/(auth)/anmelden/page.tsx`)
- System-E-Mails (`lib/mail/build-system-mails.ts`)

## Hardcode-Report

Im Admin-Panel über **Hardcode-Report** oder API `/api/admin/platform-text/report`. Zeigt Fundstellen in `app/`, `components/`, `lib/` und markiert, ob ein passender verwalteter Schlüssel existiert.

## Migrationsstrategie für weitere Texte

1. Schlüssel in `platform-text-defaults.ts` definieren
2. Komponente auf `getPlatformText()` umstellen
3. Hardcode-Report prüfen — Ziel: weniger „Hardcoded“-Einträge
