# Pflichtenheft – Alles-Wurst 2.0

**Projekt:** Alles-Wurst Lernplattform (Neuaufbau)  
**Version:** 1.0  
**Stand:** Juli 2026  
**Status:** Planungsphase  
**Bezug:** `LASTENHEFT.md` v1.0  

---

## 1. Systemübersicht

### 1.1 Architekturprinzipien

Alles-Wurst 2.0 wird als **modulare Monolith-Anwendung** mit klar getrennten Domänen geplant. Jede Domäne (Kurse, Mitgliedschaften, Community, Werkstatt usw.) besitzt eigene Geschäftslogik, teilt jedoch gemeinsame Infrastruktur (Benutzer, Zahlungen, Benachrichtigungen).

```
┌─────────────────────────────────────────────────────────────────┐
│                     Präsentationsschicht                         │
│  Web-App (SSR/CSR) · Admin-Panel · E-Mail-Templates · PDF       │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      API-Schicht (REST/GraphQL)                  │
│  Auth · Rate Limiting · Validierung · Versionierung              │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                     Domänen-Schicht (Module)                       │
├──────────┬──────────┬──────────┬──────────┬──────────┬──────────┤
│ Benutzer │ Akademie │ Mitglied-│Community │ Werkstatt│ Zahlung  │
│          │          │ schaft   │          │          │          │
├──────────┴──────────┴──────────┴──────────┴──────────┴──────────┤
│ Newsletter · Support · Benachrichtigungen · Medien · Audit       │
└────────────────────────────┬────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│              Persistenz · Cache · Queue · Dateispeicher          │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Technologieempfehlung (Zielarchitektur)

| Schicht | Empfehlung | Begründung |
|---------|------------|------------|
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS | SSR, SEO, Performance, React-Ökosystem |
| Backend | Node.js (NestJS oder Next.js API Routes) | Einheitlicher TypeScript-Stack |
| Datenbank | PostgreSQL | Relationale Integrität, JSON-Felder für flexible Payloads |
| Cache | Redis | Sessions, Rate Limiting, Queue |
| Dateispeicher | S3-kompatibel (z. B. Cloudflare R2) | Medien, PDFs, Anhänge |
| Queue | BullMQ / Redis | Newsletter-Versand, Automationen, Webhooks |
| Suche | PostgreSQL Full-Text / Meilisearch | Forum, Rezeptdatenbank, Kurse |

> **Hinweis:** In der Planungsphase werden keine dieser Technologien implementiert. Die Empfehlung dient der Roadmap-Planung.

### 1.3 Modulübersicht

| Modul | Kurzbeschreibung | Dokument |
|-------|------------------|----------|
| Benutzerverwaltung | Auth, Profile, Einstellungen, DSGVO | `ROLLENMODELL.md` |
| Akademie | Kurse, Lernpfade, Quiz, Zertifikate | `KURSSYSTEM.md` |
| Mitgliedschaften | Abos, Zugangsregeln, Meisterclub | `MITGLIEDSCHAFTEN.md` |
| Community | Forum, DM, Profile, Feed | `COMMUNITY.md` |
| Support | Tickets, Agenten, E-Mail | `COMMUNITY.md` (Abschnitt Support) |
| Newsletter | Abonnenten, Kampagnen, Automationen | `NEWSLETTER.md` |
| Werkstatt | Tools, Affiliate, Rezeptdatenbank | Dieses Dokument, Kap. 4 |
| Zahlung | Checkout, Abos, Rechnungen | `ZAHLUNGSSYSTEM.md` |
| Admin | Verwaltung aller Module | `ADMINBEREICH.md` |

---

## 2. Querschnittsfunktionen

### 2.1 Authentifizierung und Autorisierung

**Registrierung**
1. Nutzer gibt E-Mail, Passwort, Anzeigename ein.
2. System validiert Eingaben (Passwortstärke, E-Mail-Format, Eindeutigkeit).
3. Verifizierungs-E-Mail mit zeitlich begrenztem Token (24 h).
4. Nach Klick: Konto aktiv, Willkommens-E-Mail.

**Anmeldung**
- E-Mail + Passwort
- Session-basiert (HttpOnly-Cookie) oder JWT mit Refresh-Token
- Rate Limiting: max. 5 Fehlversuche / 15 Min. pro IP + E-Mail
- Optional: 2FA via TOTP

**Autorisierung**
- Rollenbasiert (RBAC) mit feingranularen Berechtigungen
- Ressourcenbasierte Prüfung (z. B. „Besitzt User Kurszugang?“)
- Mitgliedschaftslevel als zusätzliche Dimension

Details: `ROLLENMODELL.md`

### 2.2 Benachrichtigungssystem

| Kanal | Anwendungsfälle |
|-------|-----------------|
| E-Mail (transaktional) | Registrierung, Passwort, Zahlung, Ticket-Updates |
| E-Mail (Newsletter) | Kampagnen, Automationen |
| In-App | Direktnachrichten, Forum-Antworten, Kurs-Freischaltung |
| Push (optional, Phase 2) | Mobile App |

**Einstellungen:** Nutzer kann In-App- und E-Mail-Benachrichtigungen je Kategorie deaktivieren (außer gesetzlich/transaktional erforderliche).

### 2.3 Medienverwaltung

- Zentraler Medienpool im Admin
- Unterstützte Formate: JPEG, PNG, WebP, SVG, PDF, MP4 (Upload), externe Video-URLs
- Automatische Bildoptimierung (WebP, responsive Größen)
- Zugriffskontrolle: öffentlich / Mitglieder / Kurs-spezifisch

### 2.4 PDF-Generierung

| Dokument | Inhalt | Zugriff |
|----------|--------|---------|
| Rezept-PDF | Rezeptdaten, Gewürze, Schritte, Logo | Eingeloggt |
| Marinaden-PDF | Zutaten, Anteile, Anleitung | Eingeloggt (+ ggf. Premium) |
| Lake-PDF | Berechnungsergebnis, Parameter | Eingeloggt |
| Zertifikat | Name, Kurs, Datum, QR-Verifikation | Nach Kursabschluss |
| Rechnung | Positionen, Steuer, Zahlungsinfo | Nach Zahlung |

Technisch: Server-seitige Generierung (z. B. Puppeteer, React-PDF), Branding gemäß Corporate Design.

### 2.5 Audit-Log

Protokollierung kritischer Aktionen:
- Benutzer angelegt/gelöscht/rolle geändert
- Mitgliedschaft geändert
- Zahlung verarbeitet
- Admin-Einstellungen geändert
- Ticket-Status geändert (Agent)

Speicherung: Wer, Was, Wann, IP, vorheriger/neuer Wert.

---

## 3. Domänen-Spezifikationen (Kurzform)

Ausführliche Beschreibungen in den jeweiligen Fachdokumenten. Hier die Schnittstellen und Abhängigkeiten.

### 3.1 Akademie ↔ Mitgliedschaften

- Jedes Mitgliedschaftslevel definiert Kurszugänge (alle / Auswahl / Rabatt)
- Einzelkurskauf unabhängig von Mitgliedschaft möglich
- Kursabschluss triggert Zertifikat und Newsletter-Automation

### 3.2 Akademie ↔ Community

- Kursdiskussionen optional als Forum-Kategorie pro Kurs
- Abschluss-Badge im Profil sichtbar

### 3.3 Werkstatt ↔ Mitgliedschaften

| Tool | Basis | Premium | Meister |
|------|-------|---------|---------|
| Salzrechner | ✓ (öffentlich) | ✓ | ✓ |
| Lakerechner | – | ✓ | ✓ |
| Rezeptgenerator | Basis | Voll | Voll |
| Marinaden-Generator | – | ✓ | ✓ |
| Rezeptanalyse | – | – | ✓ |
| Rezeptdatenbank (lesen) | – | ✓ | ✓ |
| Rezeptdatenbank (veröffentlichen) | – | – | ✓ |

### 3.4 Zahlung ↔ Mitgliedschaften / Akademie

- Checkout erstellt `Order` → Zahlungsanbieter → Webhook → `Subscription` oder `CourseEnrollment`
- Rechnung wird automatisch erzeugt und verknüpft

### 3.5 Newsletter ↔ Alle Module

- Sync: Mitgliedschaftslevel, Kurse (gekauft/begonnen/abgeschlossen), Interessen
- Content-Blöcke in Kampagnen: Kurse, Werkstatt-Produkte, Rezept-Tipps

---

## 4. Werkstatt-Module (Detail)

### 4.1 Affiliate-Produktkatalog

**Funktion:** Kuratierte Produktempfehlungen mit Affiliate-Links.

**Entitäten:** Produkt, Produktgruppe, Affiliate-Netzwerk, Disclosure-Text

**Funktionen:**
- Produktliste mit Filter (Gruppe, Preisbereich, Bewertung)
- Layouts: Grid, Liste, Kompakt
- Produktvergleich (lokal im Browser, max. 4 Produkte)
- Klick-Tracking (intern, keine Weitergabe an Dritte ohne Consent)
- Pflicht-Disclosure oberhalb jeder Produktliste
- Admin: CRUD Produkte, Gruppen, Affiliate-URL, Bild, Preis (manuell), Verfügbarkeit

**Standard-Produktgruppen:**
Wurstfüller, Fleischwolf, Messer, Därme/Hüllen, Gewürze, Thermometer, Bücher, Einsteiger-Ausrüstung, Räucheröfen, Pökelschinken-Zubehör

### 4.2 Salzrechner

**Funktion:** Berechnung der Salzmenge (g/kg) für Wurst und Fleisch **ohne** Lake.

**Eingaben:**
- Fleischmenge (kg)
- Salzanteil (% oder g/kg)
- Optional: Pfeffer, Nitritpökelsalz-Anteil

**Ausgaben:**
- Gramm Salz gesamt
- Aufschlüsselung (Kochsalz, Nitritsalz, Gewürze)
- Hinweistexte zu Lebensmittelsicherheit

**Besonderheiten:**
- Öffentlich zugänglich (Marketing-Funnel)
- Keine Speicherung, keine externen APIs
- Responsives UI, Branding-konform

### 4.3 Lakerechner

**Funktion:** Berechnung von Pökellaken für verschiedene Produktarten.

**Lake-Arten:**
- Einfache Lake
- Pökellake (Nitrit)
- Spritzlake
- Gleichgewichtslake
- Würzlake

**Produktarten (Auswahl):**
Kochschinken, Kassler, Geflügel, Fisch, Wild, Rohschinken nass gepökelt, Braten, Rippchen

**Eingaben:**
- Produktart, Lake-Art
- Fleischmenge / -gewicht
- Lake-Parameter (Salz %, Zucker %, Nitrit, Gewürze)
- Einlegezeit, Temperatur

**Ausgaben:**
- Lake-Gesamtmenge
- Zutatenliste (g/l)
- Einlegeempfehlung
- PDF-Export (nur eingeloggt)

**Validierung:** Plausibilitätsprüfungen (Salz % Grenzwerte, Nitrit-Limits mit Warnhinweisen)

### 4.4 Rezeptgenerator

**Funktion:** Erstellung, Berechnung und Verwaltung von Wurstrezepturen.

**Rezept-Komponenten:**
| Komponente | Beschreibung |
|------------|--------------|
| Stammdaten | Name, Kategorie, Beschreibung, Sichtbarkeit |
| Fleisch | Sorten mit Prozentanteilen (Summe = 100 %) |
| Schüttung | Wasser/Eis, Nitrit, Ascorbinsäure |
| Gewürze | g/kg oder % bezogen auf Fleisch |
| Hülle | Darmtyp, Kaliber, Länge |
| Produktion | Mahlen, Mischen, Füllen, Kochen/Räuchern |
| Räucherprogramm | Phasen (Temperatur, Zeit, Rauch) |

**Berechnungen (Live):**
- Gesamtgewicht
- Fleischanteil %
- Gewürzmenge absolut
- Schüttungsmenge
- Kostenabschätzung (optional, wenn Preise hinterlegt)

**Funktionen:**
- Erstellen, Bearbeiten, Duplizieren, Löschen (eigene Rezepte)
- PDF-Export und Browser-Druck
- Veröffentlichung in gemeinsamer Datenbank (Meister)
- Import/Export (JSON, Phase 2)

**Gemeinsame Rezeptdatenbank:**
- Öffentliche Rezepte mit Filter (Kategorie, Fleischsorte, Schwierigkeit)
- Detailansicht, Favoriten, „In meine Rezepte kopieren“

### 4.5 Marinaden-Generator

**Funktion:** Erstellung von Marinadenrezepten für Fleisch, Geflügel, Fisch, Grill.

**Marinadenarten:**
Nassmarinade, Trockenmarinade, Injektionsmarinade, Eigen (frei konfigurierbar)

**Eingaben:**
- Name, Fleischsorte, Marinadenart
- Zutatenliste mit Mengen
- Marinadenanteil (%)
- Einlegezeit, Temperaturhinweise

**Funktionen:**
- Skalierung nach Fleischmenge
- Speichern (eigene Marinaden)
- PDF-Export, Druck
- Admin-Review für veröffentlichte Marinaden (optional)

**Zugang:** Premium und Meister (konfigurierbar)

### 4.6 Rezeptanalyse (Meisterwerkstatt)

**Funktion:** Technologische Bewertung von Wurstrezepturen anhand eines Referenzprofils.

**Technologieprofil:**
- Kennlinien S1–S10 (Struktur): z. B. Bindung, Fettanteil, Wasserbindung
- Kennlinien R1–R5 (Räuchern): z. B. Rauchintensität, Trocknung, Farbe
- Gesamt-Score (0–100) mit Gauge-Darstellung

**Workflow:**
1. Nutzer erstellt/bearbeitet Rezept im Generator
2. Analyse-Panel zeigt Live-Profil
3. Vergleich mit Referenzprofil (Kategorie-abhängig)
4. Snapshot speichern (Versionierung)
5. Meisterclub-Ranking (anonymisiert oder opt-in)

**Admin:**
- Referenzprofile pro Wurstkategorie pflegen
- Label-Modi (eigenes Indexsystem, thematisch, neutrale Codes)
- Schwellenwerte für Warnungen

---

## 5. Zertifikate

### 5.1 Auslöser

- Kursabschluss: alle Pflichtlektionen abgeschlossen
- Abschlussquiz bestanden (konfigurierbare Mindestpunktzahl, Standard: 80 %)
- Kein aktives Abo erforderlich zum Zeitpunkt der Ausstellung (Zertifikat bleibt gültig)

### 5.2 Inhalt

- Vollständiger Name des Teilnehmers
- Kursname und ggf. Lernpfad
- Abschlussdatum
- Eindeutige Zertifikatsnummer
- QR-Code zur Online-Verifikation
- Unterschrift / Siegel (grafisch)
- Branding: Playfair Display, Gold-Akzent, hochwertiges Layout

### 5.3 Verifikation

- Öffentliche URL: `/zertifikat/verifizieren/{nummer}`
- Anzeige: Name, Kurs, Datum, Status (gültig/widerrufen)
- Keine sensiblen Daten

---

## 6. Rechnungen

Siehe `ZAHLUNGSSYSTEM.md`. Kurz:
- Automatische Erstellung bei jeder erfolgreichen Zahlung
- Fortlaufende Rechnungsnummer (Format: AW-YYYY-NNNNN)
- PDF im Benutzerkonto abrufbar
- Admin: Übersicht, manueller Export, Storno

---

## 7. Seiten und Navigation

Vollständige Informationsarchitektur: `SEITENSTRUKTUR.md`

---

## 8. Akzeptanzkriterien (Gesamtplattform)

| Bereich | Kriterium |
|---------|-----------|
| Auth | Registrierung, Login, Passwort-Reset funktionsfähig |
| Kurse | Kurs absolvieren, Quiz bestehen, Zertifikat erhalten |
| Mitgliedschaft | Abo abschließen, Zugang zu gestaffelten Features |
| Community | Forum-Beitrag erstellen, DM senden |
| Support | Ticket erstellen, Agent antwortet, Status wechselt |
| Newsletter | DOI, Kampagne versenden, Abmeldung |
| Werkstatt | Alle Rechner liefern korrekte Ergebnisse (Testfälle) |
| Zahlung | Checkout, Webhook, Rechnung |
| Admin | Alle Module verwaltbar |
| DSGVO | Export und Löschung möglich |
| A11y | WCAG 2.1 AA Audit bestanden |
| Performance | Lighthouse Score ≥ 90 (Performance) |

---

## 9. Teststrategie (Planung)

| Testart | Umfang |
|---------|--------|
| Unit Tests | Berechnungslogik (Salz, Lake, Rezept), Berechtigungen |
| Integration Tests | API-Endpunkte, Zahlungs-Webhooks, E-Mail |
| E2E Tests | Kritische User Journeys (Registrierung → Kurs → Zertifikat) |
| Lasttests | Newsletter-Versand, gleichzeitige Video-Streams |
| Sicherheitstests | OWASP Top 10, Penetrationstest vor Go-Live |

---

## 10. Migrationskonzept (WordPress → 2.0)

| Quelle | Ziel | Strategie |
|--------|------|-----------|
| WordPress Users | `users` | 1:1 mit Passwort-Reset |
| PMPro Levels | `memberships` | Mapping Tabelle |
| LearnPress Courses | `courses` | Export/Import |
| LearnPress Progress | `enrollments` | Fortschritt migrieren |
| bbPress Topics | `forum` | HTML bereinigen |
| Support Tickets | `tickets` | Vollständig |
| Newsletter Subscribers | `subscribers` | Consent-Log mitnehmen |
| Rezepte (CPT) | `recipes` | Payload-Meta → JSON |
| Affiliate Products | `products` | 1:1 |

---

*Dieses Pflichtenheft beschreibt die technische Umsetzung aus Auftragnehmersicht. Änderungen bedürfen der Freigabe durch die Projektleitung.*
