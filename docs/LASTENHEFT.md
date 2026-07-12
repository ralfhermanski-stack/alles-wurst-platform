# Lastenheft – Alles-Wurst 2.0

**Projekt:** Alles-Wurst Lernplattform (Neuaufbau)  
**Version:** 1.0  
**Stand:** Juli 2026  
**Status:** Planungsphase  
**Verantwortlich:** Alles-Wurst / Projektleitung  

---

## 1. Einleitung

### 1.1 Hintergrund

Alles-Wurst ist die führende deutschsprachige Lern- und Community-Plattform für Wurstherstellung, Fleischverarbeitung, Räuchern und verwandte Handwerksbereiche. Die bisherige technische Umsetzung basiert auf WordPress mit zahlreichen Einzel-Plugins (LearnPress, Paid Memberships Pro, bbPress, WooCommerce sowie proprietäre Rechner- und Generator-Plugins). Diese Architektur hat Grenzen bei Performance, Wartbarkeit, einheitlicher Benutzererfahrung und Feature-Integration.

**Alles-Wurst 2.0** ist ein vollständiger Neuaufbau als integrierte Plattform. Ziel ist ein kohärentes Ökosystem aus Lernen, Community, Werkzeugen und Monetarisierung – unter einer Dachmarke, einem Designsystem und einer gemeinsamen Benutzerverwaltung.

### 1.2 Projektziel

Entwicklung einer modernen, skalierbaren Webplattform, die alle bestehenden und geplanten Geschäftsfunktionen in einem System vereint:

- Strukturierte Online-Akademie mit Kursen und Zertifikaten
- Mitgliedschaftsmodelle mit gestaffeltem Zugang
- Meisterclub als Premium-Expertenbereich
- Community mit Forum, Profilen und Direktnachrichten
- Support-Ticketsystem
- Newsletter mit Segmentierung und Automationen
- Werkstatt mit Affiliate-Produkten und interaktiven Rechnern/Generatoren
- Zahlungsabwicklung, Rechnungsstellung und Benutzerverwaltung
- Umfassender Adminbereich

### 1.3 Abgrenzung (Scope dieser Phase)

In der aktuellen Projektphase werden **ausschließlich Konzept und Dokumentation** erstellt. Es werden **keine** Datenbanken, APIs, Authentifizierung, Zahlungsintegrationen oder produktiver Anwendungscode implementiert.

### 1.4 Zielgruppen

| Persona | Alter | Bedürfnis |
|---------|-------|-----------|
| Hobbywurstler | 35–55 | Präzise Anleitungen, Rezepte, Community-Austausch |
| Grillfan | 25–45 | Exklusive Rezepte, schnelle Tools, Inspiration |
| Räucherfreund | 40–60 | Technische Tiefe, Rechner, strukturierte Kurse |
| Selbstversorger | 30–50 | Verlässliche Rezepte, Lake-/Salzberechnung, Wildverarbeitung |
| Lernender / Berufstätiger | 20–35 | Zertifikate, strukturierte Lernpfade, Nachweisbarkeit |

### 1.5 Stakeholder

| Stakeholder | Interesse |
|-------------|-----------|
| Plattformbetreiber (Alles-Wurst) | Umsatz, Skalierbarkeit, Markenführung |
| Mitglieder / Kursteilnehmer | Lernen, Tools, Community |
| Meisterclub-Mitglieder | Exklusiver Zugang, Coaching, Analyse |
| Support-Mitarbeiter | Effiziente Ticketbearbeitung |
| Redaktion / Kursautoren | Einfache Inhaltspflege |
| Newsletter-Redaktion | Segmentierung, Kampagnen, Automationen |
| Administratoren | Vollständige Systemkontrolle |

---

## 2. Geschäftliche Anforderungen

### 2.1 Mission und Positionierung

**Mission:** Traditionelles Fleischerhandwerk bewahren und für jeden zugänglich machen, der selbst anpacken will.

**Claim:** THE CREST OF CRAFTSMANSHIP

**Kommunikation:** Du-Form, ehrlich, praxisnah, handwerklich authentisch.

### 2.2 Geschäftsmodell

| Einnahmequelle | Beschreibung |
|----------------|--------------|
| Mitgliedschaften | Monatliche Abos (Basis, Premium, Meister) |
| Einzelkurse | Kauf einzelner Kurse ohne Vollmitgliedschaft |
| Meisterclub | Premium-Segment mit erweiterten Features |
| Affiliate-Werkstatt | Provisionen über Produktempfehlungen |
| Newsletter | Indirekt: Conversion und Retention (kein separater Verkauf) |

### 2.3 Erfolgskriterien (KPIs)

- Steigerung der aktiven Mitglieder (MAU)
- Kursabschlussrate ≥ 60 %
- Support-Ticket-Lösungszeit ≤ 48 h (Werktage)
- Newsletter-Öffnungsrate ≥ 35 %
- Churn-Rate Mitgliedschaften ≤ 5 % monatlich
- Seitenladezeit ≤ 2 s (LCP, Median)
- Verfügbarkeit ≥ 99,5 %

---

## 3. Funktionale Anforderungen (Übersicht)

### 3.1 Benutzerverwaltung

| ID | Anforderung | Priorität |
|----|-------------|-----------|
| BV-01 | Registrierung mit E-Mail und Passwort | Muss |
| BV-02 | E-Mail-Verifizierung bei Registrierung | Muss |
| BV-03 | Anmeldung, Abmeldung, Passwort zurücksetzen | Muss |
| BV-04 | Benutzerprofil mit Avatar, Bio, Sichtbarkeitseinstellungen | Muss |
| BV-05 | Verknüpfung von Mitgliedschaft, Kursen, Rezepten, Tickets | Muss |
| BV-06 | DSGVO: Datenexport und Kontolöschung | Muss |
| BV-07 | Zwei-Faktor-Authentifizierung (optional) | Soll |
| BV-08 | Social Login (Google, Apple) | Kann |

### 3.2 Akademie / Kurse

| ID | Anforderung | Priorität |
|----|-------------|-----------|
| KS-01 | Kurse mit Modulen und Lektionen | Muss |
| KS-02 | Video-, Text-, PDF- und Quiz-Lektionen | Muss |
| KS-03 | Lernfortschritt und Fortschrittsanzeige | Muss |
| KS-04 | Lernpfade (thematische Reihenfolge) | Muss |
| KS-05 | Kurszugang über Mitgliedschaft oder Einzelkauf | Muss |
| KS-06 | Abschlussquiz pro Kurs | Muss |
| KS-07 | Zertifikat nach bestandenem Quiz | Muss |
| KS-08 | Kursbewertungen und Rezensionen | Soll |
| KS-09 | Frühzugang für Meister-Mitglieder | Soll |

### 3.3 Mitgliedschaften

| ID | Anforderung | Priorität |
|----|-------------|-----------|
| MS-01 | Drei Mitgliedschaftsstufen: Basis, Premium, Meister | Muss |
| MS-02 | Monatliche und jährliche Abrechnung | Muss |
| MS-03 | Gestaffelter Feature-Zugang je Stufe | Muss |
| MS-04 | Upgrade/Downgrade mit anteiliger Verrechnung | Muss |
| MS-05 | Kündigung zum Periodenende | Muss |
| MS-06 | Grace Period bei Zahlungsausfall | Soll |

### 3.4 Meisterclub

| ID | Anforderung | Priorität |
|----|-------------|-----------|
| MC-01 | Exklusiver Bereich für Meister-Mitglieder | Muss |
| MC-02 | Rezeptanalyse mit Technologieprofil und Rankings | Muss |
| MC-03 | Exklusive Inhalte und Live-Sessions | Soll |
| MC-04 | Mentoring-Anfragen (asynchron) | Soll |
| MC-05 | Frühzugang zu neuen Kursen und Tools | Soll |

### 3.5 Community

| ID | Anforderung | Priorität |
|----|-------------|-----------|
| CM-01 | Öffentliches Mitgliederprofil (konfigurierbar) | Muss |
| CM-02 | Forum mit Kategorien, Themen, Antworten | Muss |
| CM-03 | Direktnachrichten zwischen Mitgliedern | Muss |
| CM-04 | Aktivitätsfeed (eigene und gefolgte Aktivitäten) | Soll |
| CM-05 | Reputation/Badges für Community-Beiträge | Soll |
| CM-06 | Moderation und Meldefunktion | Muss |

### 3.6 Support

| ID | Anforderung | Priorität |
|----|-------------|-----------|
| SP-01 | Ticket-Erstellung durch eingeloggte Nutzer | Muss |
| SP-02 | Kategorien: Technik, Zahlung, Kursinhalt, Mitgliedschaft, Tools, Sonstiges | Muss |
| SP-03 | Prioritäten und Status-Workflow | Muss |
| SP-04 | Agent-Zuweisung und interne Notizen | Muss |
| SP-05 | E-Mail-Benachrichtigungen bei Statusänderung | Muss |
| SP-06 | Dateianhänge in Tickets | Soll |

### 3.7 Newsletter

| ID | Anforderung | Priorität |
|----|-------------|-----------|
| NW-01 | Double-Opt-In-Anmeldung | Muss |
| NW-02 | Interessen und Frequenz-Präferenzen | Muss |
| NW-03 | Segmentierung (Mitgliedschaft, Kurse, Interessen) | Muss |
| NW-04 | Kampagnen mit Vorlagen und Versandplanung | Muss |
| NW-05 | Automationen (Trigger → Aktion) | Muss |
| NW-06 | Öffnungs- und Klick-Tracking | Muss |
| NW-07 | Abmeldung und Einstellungszentrum | Muss |

### 3.8 Werkstatt

| ID | Anforderung | Priorität |
|----|-------------|-----------|
| WK-01 | Affiliate-Produktkatalog mit Gruppen und Filtern | Muss |
| WK-02 | Pflicht-Disclosure bei Affiliate-Links | Muss |
| WK-03 | Salzrechner (öffentlich) | Muss |
| WK-04 | Lakerechner mit PDF-Export (Mitglieder) | Muss |
| WK-05 | Rezeptgenerator mit Speicherung und PDF | Muss |
| WK-06 | Marinaden-Generator | Muss |
| WK-07 | Rezeptanalyse / Meisterwerkstatt (Meister) | Muss |
| WK-08 | Gemeinsame Rezeptdatenbank | Soll |

### 3.9 Zahlung und Abrechnung

| ID | Anforderung | Priorität |
|----|-------------|-----------|
| ZA-01 | Zahlungsabwicklung für Mitgliedschaften und Kurse | Muss |
| ZA-02 | Automatische Rechnungserstellung (PDF) | Muss |
| ZA-03 | Rechnungshistorie im Benutzerkonto | Muss |
| ZA-04 | Unterstützung SEPA, Kreditkarte, PayPal | Muss |
| ZA-05 | Webhooks für Zahlungsstatus | Muss |
| ZA-06 | Steuerkonforme Rechnungen (DE) | Muss |

### 3.10 Adminbereich

| ID | Anforderung | Priorität |
|----|-------------|-----------|
| AD-01 | Dashboard mit Kennzahlen | Muss |
| AD-02 | Verwaltung aller Module aus einer Oberfläche | Muss |
| AD-03 | Benutzer- und Rollenverwaltung | Muss |
| AD-04 | Audit-Log für kritische Aktionen | Soll |
| AD-05 | Systemeinstellungen und Feature-Flags | Soll |

---

## 4. Nicht-funktionale Anforderungen

### 4.1 Performance

- First Contentful Paint < 1,5 s
- Largest Contentful Paint < 2,5 s
- Time to Interactive < 3,5 s
- API-Antwortzeiten (P95) < 500 ms

### 4.2 Sicherheit

- HTTPS durchgängig
- Passwörter gehasht (bcrypt/Argon2)
- CSRF-, XSS- und SQL-Injection-Schutz
- Rate Limiting bei Login und API
- DSGVO- und TTDSG-Konformität
- Cookie-Consent mit granularen Kategorien

### 4.3 Barrierefreiheit

- WCAG 2.1 Level AA
- Tastaturnavigation
- Screenreader-Kompatibilität
- Ausreichende Farbkontraste (Brandbook-konform)

### 4.4 Internationalisierung

- Primärsprache: Deutsch
- Technische Vorbereitung für Englisch (i18n-Ready)
- Datums-, Zahlen- und Währungsformat DE

### 4.5 Wartbarkeit

- Modulare Architektur mit klaren Domain-Grenzen
- Einheitliches Designsystem (Brandbook v3.0)
- Automatisierte Tests (Unit, Integration, E2E)
- CI/CD-Pipeline
- Dokumentierte APIs (OpenAPI)

### 4.6 Kompatibilität

- Responsive: Mobile First
- Browser: Chrome, Firefox, Safari, Edge (aktuelle + vorherige Version)
- Druckoptimierte PDFs (Rezepte, Zertifikate, Rechnungen)

---

## 5. Randbedingungen

| Randbedingung | Beschreibung |
|---------------|--------------|
| Marke | Corporate Design Manual v3.0 ist verbindlich |
| Hosting | EU-Rechenzentrum (DSGVO) |
| E-Mail | Transaktional + Newsletter (z. B. Brevo, SendGrid) |
| Zahlungsanbieter | Stripe und/oder Mollie (EU-konform) |
| Migration | Bestehende WordPress-Daten müssen migrierbar sein |
| Rechtliches | Impressum, Datenschutz, AGB, Widerrufsbelehrung |

---

## 6. Abhängigkeiten und Schnittstellen

| System | Zweck |
|--------|-------|
| Zahlungsanbieter | Abonnements, Einmalzahlungen |
| E-Mail-Provider | Transaktional, Newsletter, DOI |
| CDN | Medienauslieferung (Videos, Bilder) |
| Video-Hosting | Kursvideos (z. B. Vimeo, Bunny Stream) |
| Analytics | Plattform-Metriken (privacy-konform) |
| Affiliate-Netzwerke | Amazon, Awin o. Ä. (Werkstatt) |

---

## 7. Risiken

| Risiko | Auswirkung | Maßnahme |
|--------|------------|----------|
| Scope Creep | Verzögerung, Kosten | Phasenweise Roadmap, MVP-Definition |
| Datenmigration | Datenverlust, Downtime | Migrationsplan, Staging, Rollback |
| Komplexität Werkzeuge | Hoher Entwicklungsaufwand | Bestehende Logik als Referenz, schrittweise Portierung |
| DSGVO-Verstöße | Bußgelder, Reputation | Privacy by Design, Rechtsberatung |
| Performance bei Videos | Schlechte UX | CDN, adaptives Streaming |

---

## 8. Glossar

| Begriff | Definition |
|---------|------------|
| Akademie | Gesamtheit aller Lernangebote (Kurse, Lernpfade) |
| Lernpfad | Thematisch geordnete Abfolge von Kursen |
| Meisterclub | Premium-Segment innerhalb der Meister-Mitgliedschaft |
| Meisterwerkstatt | Rezeptanalyse-Modul mit Technologieprofil |
| Werkstatt | Bereich mit Tools und Affiliate-Produkten |
| Segment | Newsletter-Zielgruppe nach Regeln definiert |
| Grace Period | Kulanzzeit nach fehlgeschlagener Zahlung |

---

## 9. Referenzdokumente

| Dokument | Beschreibung |
|----------|--------------|
| `PFLICHTENHEFT.md` | Technische Umsetzungsspezifikation |
| `ROLLENMODELL.md` | Rollen und Berechtigungen |
| `DATENMODELL.md` | Konzeptionelles Datenmodell |
| `SEITENSTRUKTUR.md` | Informationsarchitektur |
| `ROADMAP.md` | Implementierungsphasen |
| Corporate Design Manual v3.0 | Marken- und Designrichtlinien |

---

*Dieses Lastenheft beschreibt die Anforderungen aus Auftraggebersicht. Die technische Ausgestaltung erfolgt im Pflichtenheft und den Fachmodul-Dokumenten.*
