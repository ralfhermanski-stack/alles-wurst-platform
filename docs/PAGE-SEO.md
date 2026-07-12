# Automatisches SEO (öffentliche Seiten)

Site-weites SEO-System für alle öffentlichen Seiten außer Blog-Artikeln (die behalten ihr eigenes SEO im Magazin-Editor).

## Admin

- Navigation: **System → SEO** (`/admin/seo`)
- Übersicht aller registrierten Seiten mit Status (automatisch / manuell / ungeprüft / veraltet)
- Aktionen:
  - **SEO für alle öffentlichen Seiten prüfen** — Scan + Queue
  - **Fehlende SEO-Daten automatisch erzeugen**
  - **Automatische SEO-Daten neu generieren** (nur `seo_source = auto`)
  - **Warteschlange verarbeiten**

## Einstellungen

| Einstellung | Bedeutung |
|-------------|-----------|
| Automatische SEO-Erzeugung | Neue/fehlende Seiten in Queue |
| Automatische Aktualisierung | Bei Content-Hash-Änderung neu einplanen |
| Nur veröffentlichte Seiten | Draft-Kurse etc. ignorieren |
| Max. API-Aufrufe/Tag | OpenAI-Limit (Fallback ohne Key) |

## Technik

| Bereich | Pfad |
|---------|------|
| Services | `lib/page-seo/` |
| Migration | `20260709170000_site_page_seo` |
| Admin-API | `/api/admin/page-seo/*` |
| Cron | `POST /api/cron/page-seo` mit `Authorization: Bearer $PAGE_SEO_CRON_SECRET` |
| Metadata | `resolvePageMetadata()`, `buildStaticPageMetadata()` |
| JSON-LD | `components/seo/PageSeoJsonLd.tsx` |

## Manuelle SEO-Daten

Einträge mit `seo_source = manual` werden **nie** automatisch überschrieert.

## API-Kosten

- Jede KI-Generierung zählt gegen das Tageslimit
- Ohne `OPENAI_API_KEY` oder bei Limit: heuristischer Fallback (keine API-Kosten)
- Content-Hash verhindert unnötige Neugenerierung

## Cron (Beispiel)

```bash
curl -X POST https://alles-wurst.de/api/cron/page-seo \
  -H "Authorization: Bearer $PAGE_SEO_CRON_SECRET"
```

## Tests

```bash
node scripts/test-page-seo.cjs
```

## Blog

Blog-Artikel (`/magazin/[slug]`) sind **ausgeschlossen** und nutzen weiterhin `lib/blog/blog-seo-*`.
