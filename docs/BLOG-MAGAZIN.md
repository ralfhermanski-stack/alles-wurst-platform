# Blog / Magazin — Alles-Wurst

Vollständiges Blog-System unter `/magazin` (öffentlich) und `/admin/magazin` (Admin/Autoren).

## Funktionen

- Artikel erstellen, bearbeiten, planen, veröffentlichen, archivieren
- SEO-Felder (Titel, Meta, Canonical, OpenGraph, Twitter, robots)
- Schema.org: BlogPosting, FAQPage, BreadcrumbList, Organization, Person
- Themencluster, Kategorien, Schlagwörter, Keywords, FAQ
- Qualitätsprüfung vor Veröffentlichung
- Automatische Sitemap (`/sitemap.xml`) und robots.txt
- Geplante Veröffentlichung via `scheduledAt`
- Verwandte Artikel, Linkvorschläge, CTA-Boxen

## Rechte

| Rolle | Rechte |
|-------|--------|
| ADMIN | Lesen, Schreiben, Veröffentlichen, Taxonomie |
| INSTRUCTOR | Eigene Artikel lesen/schreiben (Entwürfe) |
| Andere | Kein Admin-Zugriff |

## Einrichtung

```bash
# Migration anwenden
npm run db:migrate

# Prisma Client generieren (Dev-Server ggf. stoppen)
npm run db:generate
```

## Testanleitung

1. Dev-Server starten: `npm run dev`
2. Als Admin anmelden: `/admin/magazin`
3. Kategorie anlegen unter `/admin/magazin/kategorien`
4. Artikel erstellen, Beitragsbild hochladen, SEO/FAQ ausfüllen
5. Qualität prüfen (Tab „Qualität“) und veröffentlichen
6. Öffentlich prüfen: `/magazin` und `/magazin/[slug]`
7. Automatisierter Test:

```bash
node scripts/test-blog-system.cjs
```

Optional:

```bash
set TEST_ADMIN_EMAIL=ihre@email.de
set TEST_ADMIN_PASSWORD=IhrPasswort
node scripts/test-blog-system.cjs
```

## Wichtige Pfade

| Bereich | Pfad |
|---------|------|
| Schema | `prisma/schema.prisma` (BlogPost, BlogCategory, …) |
| Services | `lib/blog/` |
| Admin UI | `components/admin/blog/` |
| Public UI | `components/blog/`, `app/(marketing)/magazin/` |
| APIs | `app/api/admin/blog/`, `app/api/blog/` |

## SEO / KI-Hinweise

- Tab **SEO & KI** im Artikel-Editor: Analyse, Vorschläge übernehmen, Schema prüfen
- API: `POST /api/admin/blog/posts/[postId]/seo-analyze`, `POST …/seo-apply`, `GET …/schema-validate`
- Service: `lib/blog/blog-seo-ai-service.ts` (OpenAI via `OPENAI_API_KEY`, sonst Fallback)
- Migration: `20260709140000_blog_seo_ai_fields`
- Tests: `node scripts/test-blog-seo-ai.cjs`
- Kurz-Zusammenfassung (`summary`) am Artikelanfang für KI-Extraktion
- FAQ-Block mit Schema.org FAQPage
- Saubere H1 nur im Seitenkopf; Markdown-Body nutzt H2/H3
- Keine versteckten Inhalte — Qualitätsprüfung blockiert Spam-Muster
- `contentUpdatedAt` wird bei relevanten Änderungen an veröffentlichten Artikeln gesetzt
- Artikel älter als 12 Monate werden im Admin als „fachlich prüfen“ markiert

## Vorschau

Entwürfe sind nicht öffentlich. Vorschau-Link im Admin:

`/magazin/[slug]?preview=[postId]`

(Nur mit gültiger Post-ID als Preview-Token.)
