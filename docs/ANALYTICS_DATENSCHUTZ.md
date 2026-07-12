# Analytics — Datenschutz-Hinweise (DSGVO / TDDDG)

Dieses Dokument ergänzt die Datenschutzerklärung um technische Details zum First-Party-Analytics-System.

## Verantwortlicher / Zweck

Zweck der Verarbeitung ist die **aggregierte Auswertung der Plattformnutzung** zur Verbesserung von Inhalten, Kursen und Conversion-Funnels. Es werden **keine Einzelprofile** im Adminbereich angezeigt.

## Rechtsgrundlagen

| Verarbeitung | Grundlage |
|---|---|
| Technisch notwendige Cookies (Session, Consent) | Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse) / § 25 Abs. 2 Nr. 2 TDDDG |
| Statistik-Tracking | Art. 6 Abs. 1 lit. a DSGVO (Einwilligung) / § 25 Abs. 1 TDDDG |

## Ohne Einwilligung (Basis-Statistik)

Erfasste Daten (stark anonymisiert):
- Seitenaufruf-Zähler
- Datum/Uhrzeit
- Normalisierte Route / Page-Type
- HTTP-Status
- Referrer-Domain (ohne vollständige URL)

**Nicht erfasst:** User-ID, Session-ID, vollständige IP, User-Agent-Rohdaten, Fingerprints.

## Mit Statistik-Einwilligung

Zusätzlich session-basiert:
- Seitenaufrufe, Einstiegs-/Ausstiegsseiten
- Verweildauer, Scrolltiefe (25/50/75/100 %)
- Klicks auf markierte Elemente
- Kurs-, Checkout-, Community- und Support-Events

Session-Identifikator: anonymisierter Schlüssel in HttpOnly-Cookie `aw_analytics_sid`.

Eingeloggte Nutzer: `user_id` nur bei aktivem Statistik-Consent, ausschließlich für Funnel-/Kurs-Auswertungen.

## Technische Schutzmaßnahmen

- IP-Adressen werden **nicht vollständig** gespeichert (nur gehashte Kurzform im Consent-Log)
- User-Agent wird nicht im Klartext gespeichert (nur Browser-Familie + Hash)
- Keine Weitergabe an Google, Meta, Facebook oder andere Tracking-Dienste
- Rohdaten werden nach **90 Tagen** gelöscht (aggregierte Tageswerte bleiben länger)
- Admins können vom Tracking ausgeschlossen werden (`ANALYTICS_EXCLUDE_ADMINS=true`)

## Cookies

| Cookie | Kategorie | Zweck |
|---|---|---|
| `aw_consent` | Notwendig | Speicherung der Consent-Entscheidung |
| `aw_analytics_sid` | Statistik | Anonyme Session (nur nach Consent) |
| `aw_session` | Notwendig | Login-Session (separat) |

## Betroffenenrechte

Nutzer können die Einwilligung jederzeit über **Cookie-Einstellungen** im Footer widerrufen. Nach Widerruf werden keine weiteren Statistik-Events erfasst; das Session-Cookie wird gelöscht.

## Testanleitung

Voraussetzungen: Dev-Server (`npm run dev`), Datenbank, Migration ausgeführt.

```bash
npx prisma migrate deploy
node scripts/test-analytics.cjs
```

### Manuelle Tests

1. **Ohne Consent:** Seite aufrufen → nur `basic_pageview` in DB, kein `aw_analytics_sid`
2. **Mit Consent:** Banner → „Statistik akzeptieren“ → Pageviews + Session
3. **Widerruf:** Footer → Cookie-Einstellungen → Consent entziehen
4. **Scrolltiefe:** Mit Consent scrollen → `scroll_depth`-Events
5. **Klick:** Element mit `data-analytics-event` klicken
6. **Admin:** `/admin/statistiken` nur als Admin erreichbar
7. **Cron:** `POST /api/cron/analytics` mit Bearer-Secret
8. **Admin-Ausschluss:** Als Admin einloggen → kein Statistik-Tracking (wenn aktiviert)

### Automatisierte Tests

Das Skript `scripts/test-analytics.cjs` prüft:
- Consent-API (grant/deny/revoke)
- Basis-Pageview ohne Consent
- Statistik-Events mit Consent
- Admin-API-Zugriffsschutz
- Aggregation + Purge (wenn DB verfügbar)

## Textbaustein für Datenschutzerklärung

> Wir verwenden ein eigenes First-Party-Statistiksystem auf unseren Servern. Ohne Ihre Einwilligung werden nur anonymisierte Basiszugriffszahlen erhoben. Mit Ihrer Einwilligung in die Kategorie „Statistik“ analysieren wir die Nutzung unserer Website session-basiert, um Inhalte und Funktionen zu verbessern. Es erfolgt keine Übermittlung an Drittanbieter wie Google oder Meta. Sie können Ihre Einwilligung jederzeit widerrufen.
