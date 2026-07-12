# Visueller Seiteneditor

Dokumentation für den geschützten Inline-Seiteneditor im Adminbereich.

## Architektur

```
Admin UI (/admin/inhalte/seiteneditor)
  ├── Seitenliste (API: GET /api/admin/page-editor/pages)
  └── Editor-Shell (/admin/inhalte/seiteneditor/[pageId])
        ├── Werkzeugleiste (Viewport, Undo/Redo, Veröffentlichen)
        ├── iframe → /admin/inhalte/seiteneditor/frame/[pageId]?token=…
        │     └── setzt httpOnly Preview-Cookie → Redirect zur echten Route
        └── Sidebar (Inhalt, Elemente, Technik)

Öffentliche Seite (z. B. /)
  └── PlatformText-Komponenten
        ├── Normal: nur veröffentlichter Text (value)
        └── Preview (Middleware-Header): Entwurf + Inline-Overlay
```

## Sicherheitsmodell

| Anforderung | Umsetzung |
|---|---|
| Nur Administratoren | `systemRole === ADMIN` + Berechtigung `content.manage` |
| Kein öffentlicher `?edit=true` | Editor nur über Admin-Routen und signierten Preview-Token |
| Serverseitige Prüfung | Alle Schreib-APIs prüfen Admin + Seitenzuordnung des Textschlüssels |
| Preview-Token | HMAC-signiert, 30 Min. gültig, an User/Session gebunden |
| XSS-Schutz | HTML-Stripping/Sanitizing in `page-editor-sanitize.ts` |
| Rate-Limiting | 60 Schreibvorgänge pro Minute und Benutzer |
| Audit-Log | `platform_text_change_logs` mit Aktionstyp (`draft_save`, `publish`, …) |

## Rollen und Berechtigungen

- **ADMIN** mit `content.manage`: Seiteneditor, Entwürfe, Veröffentlichung
- **settings.write** (Textverwaltung): weiterhin für `/admin/inhalte/texte`
- Normale Benutzer und Gäste: kein Editor-Overlay, keine Schreib-APIs

## Datenmodell

Erweiterungen an `platform_texts`:

- `draft_value`, `status`, `published_at`, `published_by`
- `page_path`, `content_type`, `max_length`, `allow_rich_text`

Neue Tabellen:

- `editable_pages` — registrierte Seiten
- `editable_page_elements` — Textschlüssel pro Seite
- `page_content_releases` — Veröffentlichungsläufe
- `page_editor_sessions` — kurzlebige Preview-Sessions

Migration: `prisma/migrations/20260710120000_visual_page_editor/migration.sql`

## Entwurf und Veröffentlichung

1. Änderung im Editor → `POST /api/admin/page-editor/draft` → `draft_value` + `status: draft`
2. Öffentliche Seite zeigt weiterhin `value` (veröffentlicht)
3. Preview-Cookie aktiv → `getPlatformTextForEditor()` liefert `draft_value`
4. `POST /api/admin/page-editor/publish` → alle Entwürfe der Seite werden nach `value` übernommen
5. `POST /api/admin/page-editor/discard` verwirft alle Entwürfe einer Seite

## Neue Seite registrieren

1. Eintrag in `lib/page-editor/page-registry.ts` anlegen (`id`, `name`, `path`, `category`, `textKeys`)
2. Standardtexte in `lib/platform-text/platform-text-defaults.ts` ergänzen
3. Seite mit `<PlatformText textKey="…" />` im Frontend anbinden
4. Beim ersten API-Aufruf synchronisiert `syncEditablePagesFromRegistry()` DB-Einträge

## Neues editierbares Element anlegen

```tsx
<PlatformText
  textKey="home.hero.title"
  elementType="heading"
  as="span"
  fallback="Fallback-Text"
/>
```

## Dynamische Inhalte

- **Globale Texte**: `platform_texts` über `PlatformText`
- **Datensatz-Inhalte** (Kurstitel, Rezeptname): bestehendes Modell — später einheitlich im Editor markieren

## Bildbearbeitung / SEO

Grundstruktur vorbereitet (`elementType: image`, `seo_title`, `seo_description`). Vollständige UI folgt in späteren Migrationsschritten.

## Fehlerbehebung

| Meldung | Ursache / Lösung |
|---|---|
| Editor-Sitzung abgelaufen | Seite neu öffnen (neue Session) |
| Keine Berechtigung | Nur ADMIN mit `content.manage` |
| Text nicht speicherbar | Textschlüssel muss in `editable_page_elements` der Seite registriert sein |
| Migration fehlt | `npx prisma migrate deploy` ausführen |

## Testanleitung

```bash
node scripts/test-page-editor.cjs
```

### Manueller Testbericht (Kurz)

1. Als Admin anmelden → **Inhalte → Seiten bearbeiten**
2. Startseite wählen → **Seite bearbeiten**
3. Hero-Überschrift anklicken → Text ändern → **Entwurf speichern**
4. Öffentliche Startseite in neuem Tab: alter Text sichtbar
5. Im Editor iframe: neuer Entwurf sichtbar
6. **Veröffentlichen** → öffentliche Seite zeigt neuen Text
7. Als normaler Benutzer `/` aufrufen: kein Editor-Overlay
8. `?edit=true` an `/` anhängen: kein Editor

## Bekannte Einschränkungen

- Nur Priorität-1-Teile der Startseite (Hero, Kursbereiche, Empfohlene Kurse) sind angebunden
- Navigation/Footer teilweise über Textverwaltung, noch nicht vollständig im visuellen Editor
- Bild-, SEO- und Rich-Text-Editoren: Basis vorhanden, UI noch minimal
- Vorschau-Rolle (Gast/Mitglied) simuliert noch keine echte Berechtigungsdarstellung
