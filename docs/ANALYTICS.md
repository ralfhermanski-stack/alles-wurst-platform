# Analytics — First-Party-Statistiken

Die Plattform nutzt ein **eigenes, consent-basiertes Analytics-System** ohne Google Analytics, Meta Pixel oder andere externe Tracker.

## Architektur

| Komponente | Pfad |
|---|---|
| Prisma-Modelle | `prisma/schema.prisma` (Analytics*) |
| Privacy-Helfer | `lib/analytics/analytics-privacy.ts` |
| Event-Ingestion | `lib/analytics/analytics-event-service.ts` |
| Aggregation / Cron | `lib/analytics/analytics-aggregation-service.ts` |
| Admin-Auswertungen | `lib/analytics/analytics-query-service.ts` |
| Client-Tracking | `lib/analytics/analytics-client.ts` |
| Consent-Banner | `components/consent/ConsentBanner.tsx` |
| Admin-Seite | `/admin/statistiken` |

## Tracking-Stufen

### Ohne Statistik-Consent (Basis)
- Serverseitig über Middleware → `POST /api/analytics/basic`
- Erfasst: Seitenzähler, Route, Page-Type, Referrer-Domain
- **Keine** Session-ID, User-ID, vollständige IP, Fingerprints

### Mit Statistik-Consent
- Client-Tracking über `AnalyticsProvider`
- Session-Cookie `aw_analytics_sid` (HttpOnly, nur nach Consent)
- Events: Pageviews, Scrolltiefe, Klicks, Funnels, Kurs-/Checkout-Events

## APIs

| Route | Zugriff | Beschreibung |
|---|---|---|
| `POST /api/analytics/event` | Öffentlich (mit Consent) | Event-Batch |
| `POST /api/analytics/basic` | Intern (Middleware) | Basis-Pageview |
| `POST /api/consent` | Öffentlich | Consent speichern |
| `GET /api/admin/analytics/overview` | Admin | Übersicht |
| `GET /api/admin/analytics/pages` | Admin | Seiten + Suche |
| `GET /api/admin/analytics/funnels` | Admin | Funnel-Auswertung |
| `GET /api/admin/analytics/courses` | Admin | Kurs-Statistiken |
| `GET /api/admin/analytics/checkout` | Admin | Checkout |
| `POST /api/cron/analytics` | Cron (Bearer) | Aggregation + Purge |

## Cronjob

```bash
curl -X POST http://localhost:3000/api/cron/analytics \
  -H "Authorization: Bearer $PAGE_SEO_CRON_SECRET"
```

Optional: `ANALYTICS_CRON_SECRET` (sonst Fallback auf `PAGE_SEO_CRON_SECRET`).

Aufgaben:
- Tägliche Aggregation (Seiten, Funnels, Metriken)
- Löschung von Rohdaten älter als 90 Tage (`ANALYTICS_RAW_RETENTION_DAYS`)

## Umgebungsvariablen

| Variable | Standard | Beschreibung |
|---|---|---|
| `ANALYTICS_RAW_RETENTION_DAYS` | `90` | Rohdaten-Aufbewahrung |
| `ANALYTICS_EXCLUDE_ADMINS` | `true` | Admins vom Statistik-Tracking ausschließen |
| `ANALYTICS_CRON_SECRET` | — | Cron-Autorisierung |

## Client-Integration

```tsx
import { useAnalytics } from "@/lib/analytics/use-analytics";

const { track } = useAnalytics();
track("course_started", { courseSlug: "wurst-basics" });
```

Klick-Tracking per HTML-Attribut:

```html
<button data-analytics-event="checkout_start" data-analytics-course="wurst-basics">
  Jetzt kaufen
</button>
```

## Tests

```bash
node scripts/test-analytics.cjs
```

Siehe Testanleitung in `docs/ANALYTICS_DATENSCHUTZ.md`.
