# Adminbereich – Alles-Wurst 2.0

**Version:** 1.0  
**Stand:** Juli 2026  
**Bezug:** `ROLLENMODELL.md`, `SEITENSTRUKTUR.md`  

---

## 1. Übersicht

Der Adminbereich ist die zentrale Verwaltungsoberfläche für Plattformbetreiber, Redakteure, Support-Mitarbeiter und Kursautoren. Er ist unter `/admin` erreichbar und erfordert entsprechende Systemrollen.

### 1.1 Designprinzipien

- **Konsistenz:** Gleiches Designsystem wie Frontend, angepasst für Datenverwaltung
- **Effizienz:** Häufige Aktionen in ≤ 3 Klicks erreichbar
- **Sicherheit:** Kritische Aktionen mit Bestätigung, Audit-Log
- **Responsive:** Desktop-first, Tablet nutzbar, Mobile eingeschränkt

### 1.2 Zugriffskontrolle

| Rolle | Admin-Zugang | Umfang |
|-------|--------------|--------|
| Super-Admin | Vollzugriff | Alles inkl. Systemeinstellungen, Rollen |
| Administrator | Vollzugriff | Alles außer Rollenverwaltung |
| Editor | Eingeschränkt | Werkstatt, Medien, Seiteninhalte |
| Moderator | Eingeschränkt | Community, Forum, Meldungen |
| Newsletter-Redakteur | Eingeschränkt | Newsletter-Modul |
| Kursautor | Eingeschränkt | Eigene Kurse |
| Support-Agent | Eingeschränkt | Support-Tickets, Benutzer (lesen) |

---

## 2. Dashboard `/admin`

### 2.1 Kennzahlen-Widgets

| Widget | Metrik | Zeitraum |
|--------|--------|----------|
| Aktive Mitglieder | Anzahl aktiver Abos | Heute / 7d / 30d |
| Neue Registrierungen | Anzahl | 7d / 30d |
| Kursabschlüsse | Anzahl | 7d / 30d |
| Umsatz | EUR (Brutto) | Monat / Quartal |
| Offene Tickets | Anzahl nach Priorität | Aktuell |
| Newsletter-Abonnenten | Aktive Abonnenten | Gesamt |
| Churn-Rate | Kündigungen / Aktive | 30d |

### 2.2 Aktivitätsfeed

- Letzte Registrierungen
- Letzte Käufe
- Letzte Ticket-Erstellungen
- Letzte Kursabschlüsse
- Systemwarnungen (fehlgeschlagene Zahlungen, Bounces)

### 2.3 Schnellaktionen

- Neuer Kurs
- Neue Kampagne
- Ticket zuweisen
- Benutzer suchen

---

## 3. Benutzerverwaltung `/admin/benutzer`

### 3.1 Benutzerliste

**Spalten:** Name, E-Mail, Rolle, Mitgliedschaft, Status, Registriert, Letzter Login  
**Filter:** Rolle, Mitgliedschaft, Status, Registrierungszeitraum  
**Aktionen:** Bearbeiten, Sperren, Impersonate (Admin), Export

### 3.2 Benutzerdetail `/admin/benutzer/{id}`

**Tabs:**

| Tab | Inhalt |
|-----|--------|
| Profil | Stammdaten, Avatar, Bio, Rolle ändern |
| Mitgliedschaft | Aktueller Plan, Historie, manuell zuweisen |
| Kurse | Einschreibungen, Fortschritt |
| Rezepte | Gespeicherte Rezepte (Admin-Einsicht) |
| Tickets | Support-Historie |
| Rechnungen | Zahlungshistorie |
| Aktivität | Login-Historie, Audit-Einträge |
| Notizen | Interne Admin-Notizen |

### 3.3 Aktionen

| Aktion | Berechtigung | Audit |
|--------|--------------|-------|
| Rolle ändern | Admin, Super-Admin | Ja |
| Mitgliedschaft zuweisen | Admin | Ja |
| Meisterclub-Override | Admin | Ja |
| Sperren / Entsperren | Admin, Moderator | Ja |
| Passwort zurücksetzen (Link senden) | Admin | Ja |
| Konto löschen (DSGVO) | Admin | Ja, mit Bestätigung |
| Impersonate | Super-Admin | Ja, zeitlich begrenzt |

### 3.4 Massenaktionen

- E-Mail senden (über Newsletter-Segment)
- Export (CSV)
- Tag setzen

---

## 4. Kursverwaltung `/admin/kurse`

Siehe auch `KURSSYSTEM.md`.

### 4.1 Kursliste

**Spalten:** Titel, Autor, Status, Einschreibungen, Abschlussrate, Veröffentlicht  
**Filter:** Status, Autor, Kategorie, Zugangstyp  
**Aktionen:** Bearbeiten, Duplizieren, Vorschau, Löschen

### 4.2 Kurs-Editor

**Workflow:** Entwurf → Review → Veröffentlicht → Archiviert

**Bereiche:**
1. **Grunddaten:** Titel, Slug, Beschreibung, Thumbnail, Trailer
2. **Zugang:** Typ, Preis, erforderliche Mitgliedschaft, Frühzugang
3. **Module & Lektionen:** Drag-and-Drop-Sortierung, Inline-Bearbeitung
4. **Quiz:** Fragen-Editor mit Vorschau
5. **Zertifikat:** Aktivieren, Mindestpunktzahl
6. **SEO:** Meta-Titel, Beschreibung, OG-Bild
7. **Vorschau:** Kurs als Teilnehmer sehen

### 4.3 Lernpfade `/admin/lernpfade`

- Pfade erstellen, Kurse zuordnen, Reihenfolge
- Veröffentlichungsstatus

### 4.4 Zertifikate `/admin/zertifikate`

- Ausgestellte Zertifikate einsehen
- Zertifikat widerrufen (mit Begründung)
- Verifikations-Log

---

## 5. Mitgliedschaften `/admin/mitgliedschaften`

Siehe auch `MITGLIEDSCHAFTEN.md`.

### 5.1 Pläne verwalten

| Feld | Beschreibung |
|------|--------------|
| Name, Slug | Anzeige und technischer Name |
| Preise | Monatlich, jährlich |
| Features | Feature-Liste (Marketing) |
| Zugangsregeln | Maschinenlesbare Regeln |
| Trial | Testtage |
| Aktiv | Plan buchbar |

### 5.2 Abonnements

- Liste aller aktiven/gekündigten Abos
- Filter: Plan, Status, Zeitraum
- Manuelle Aktionen: Verlängern, Kündigen, Plan wechseln

### 5.3 Meisterclub-Overrides

- Nutzer mit manuellem Meisterclub-Zugang
- Ablaufdatum, Begründung

---

## 6. Community `/admin/community`

### 6.1 Forum-Verwaltung

| Funktion | Beschreibung |
|----------|--------------|
| Kategorien | CRUD, Reihenfolge, Zugangslevel |
| Themen | Liste, Sperren, Löschen, Anpinnen |
| Antworten | Moderieren, als Lösung markieren |
| Meldungen | Offene Reports bearbeiten |

### 6.2 Moderation

**Meldungs-Warteschlange:**
- Gemeldeter Inhalt mit Kontext
- Aktionen: Beitrag löschen, Nutzer verwarnen, Nutzer sperren, Meldung abweisen
- Moderations-Log

### 6.3 Badges

- Badge-Typen definieren
- Manuell vergeben/entziehen

---

## 7. Support `/admin/support`

### 7.1 Ticket-Übersicht

**Ansichten:**
- Alle Tickets
- Meine zugewiesenen
- Unzugewiesen
- Nach Priorität
- Nach Kategorie

**Spalten:** Nummer, Betreff, Nutzer, Kategorie, Priorität, Status, Agent, Erstellt, Aktualisiert

### 7.2 Ticket-Detail

- Vollständiger Nachrichtenverlauf
- Interne Notizen (nur Agenten sichtbar)
- Dateianhänge
- Agent zuweisen
- Status ändern
- Kollisionswarnung (wenn anderer Agent bearbeitet)
- Nutzer-Profil-Quicklink
- Verwandte Tickets

### 7.3 Einstellungen

| Einstellung | Beschreibung |
|-------------|--------------|
| Kategorien | Anpassen, Reihenfolge |
| Prioritäten | Labels, SLA-Zeiten |
| E-Mail-Templates | Benachrichtigungen |
| Auto-Zuweisung | Round-Robin oder nach Kategorie |
| Agenten | Support-Agent-Rolle zuweisen |

### 7.4 Statistiken

- Tickets pro Kategorie/Priorität
- Durchschnittliche Lösungszeit
- Agent-Performance
- Kundenzufriedenheit (optional, Phase 2)

---

## 8. Newsletter `/admin/newsletter`

Siehe auch `NEWSLETTER.md`.

### 8.1 Abonnenten

- Liste mit Status, Interessen, Mitgliedschaft
- Import (CSV mit Consent)
- Export (DSGVO-konform)
- Einzeln bearbeiten, löschen

### 8.2 Segmente

- Segment-Builder (visuell)
- Regeln: Mitgliedschaft, Kurse, Interessen, Verhalten
- Vorschau: Anzahl betroffener Abonnenten
- Manuell neu berechnen

### 8.3 Kampagnen

- Kampagnenliste (Entwurf, geplant, gesendet)
- Editor: Block-basiert (Text, Bild, Button, Kurs-Block, Produkt-Block)
- Vorschau (Desktop/Mobile)
- Testversand
- Planung oder sofortiger Versand
- Statistiken nach Versand

### 8.4 Automationen

- Trigger-Auswahl (Registrierung, Kursabschluss, Abo-Start, etc.)
- Bedingungen und Aktionen
- Aktivieren/Deaktivieren
- Ausführungs-Log

### 8.5 Vorlagen

- Wiederverwendbare E-Mail-Vorlagen
- Branding (Logo, Farben, Footer)

### 8.6 Einstellungen

- Absender-Name und -E-Mail
- DOI-Einstellungen
- Bounce/Complaint-Handling
- Provider-Konfiguration (API-Keys)

---

## 9. Werkstatt `/admin/werkstatt`

### 9.1 Affiliate-Produkte

**Produktliste:** Name, Gruppe, Preis, Status, Klicks (30d)  
**Produkt-Editor:** Name, Beschreibung, Bild, Affiliate-URL, Netzwerk, Gruppe, Featured, Sortierung

**Produktgruppen:** CRUD, Icon, Beschreibung

**Disclosure-Text:** Globaler Affiliate-Hinweis (Pflicht)

### 9.2 Rezeptdatenbank

- Veröffentlichte Rezepte moderieren
- Rezept ablehnen/entfernen
- Featured Rezepte setzen

### 9.3 Marinaden

- Veröffentlichte Marinaden reviewen (optional)
- Ablehnen/Entfernen

### 9.4 Analyse-Referenzprofile

- Referenzprofile pro Wurstkategorie
- Kennlinien S1–S10, R1–R5 pflegen
- Label-Modus konfigurieren

### 9.5 Tool-Einstellungen

| Tool | Konfigurierbar |
|------|----------------|
| Salzrechner | Standardwerte, Hinweistexte |
| Lakerechner | Produktarten, Lake-Arten, PDF-Footer |
| Rezeptgenerator | Kategorien, Max. Rezepte (Basis), PDF-Logo |
| Marinaden | Zugangslevel, Review-Pflicht |

---

## 10. Zahlungen `/admin/zahlungen`

Siehe auch `ZAHLUNGSSYSTEM.md`.

### 10.1 Bestellungen

- Liste aller Orders mit Status
- Detail: Positionen, Zahlung, Nutzer
- Manuell erstatten (mit Bestätigung)

### 10.2 Rechnungen

- Rechnungsliste mit Nummer, Nutzer, Betrag, Status
- PDF herunterladen
- Rechnung manuell erstellen (Sonderfälle)
- Storno/Gutschrift

### 10.3 Abonnements

- Aktive Abos mit nächstem Abrechnungsdatum
- Fehlgeschlagene Zahlungen (Past Due)
- Grace Periods

### 10.4 Einstellungen

- Zahlungsanbieter (Stripe/Mollie API-Keys)
- Steuersätze
- Rechnungsnummern-Format
- Firmendaten (Rechnungskopf)
- Webhook-Log

---

## 11. Medien `/admin/medien`

- Medienbibliothek (Grid/Liste)
- Upload (Drag & Drop, Bulk)
- Ordner/Tags
- Bilddetails: Alt-Text, URL kopieren, Ersetzen
- Nutzungsnachweis (wo wird Medium verwendet)
- Speicherplatz-Übersicht

---

## 12. Einstellungen `/admin/einstellungen`

### 12.1 Allgemein

- Seitenname, Logo, Favicon
- Kontakt-E-Mail, Support-E-Mail
- Wartungsmodus
- Feature-Flags

### 12.2 Rechtliches

- Impressum, Datenschutz, AGB (Rich-Text-Editor)
- Cookie-Banner-Konfiguration

### 12.3 E-Mail

- SMTP / Provider-Einstellungen
- Absender für transaktionale E-Mails
- E-Mail-Templates (Willkommen, Passwort-Reset, etc.)

### 12.4 Integrationen

- Zahlungsanbieter
- Newsletter-Provider
- Analytics (privacy-konform)
- Video-Hosting

### 12.5 Rollen `/admin/einstellungen/rollen` (Super-Admin)

- Rollen anzeigen
- Berechtigungen pro Rolle anpassen
- Custom Roles erstellen (optional)

---

## 13. Audit-Log `/admin/audit-log`

| Spalte | Beschreibung |
|--------|--------------|
| Zeitpunkt | UTC |
| Akteur | Benutzer oder „System“ |
| Aktion | z. B. `user.role_changed` |
| Ziel | Betroffene Entität |
| Details | Vorher/Nachher (expandierbar) |
| IP | IP-Adresse |

**Filter:** Akteur, Aktion, Zeitraum, Ziel-Typ  
**Export:** CSV für Compliance

---

## 14. Admin-Navigation (Sidebar)

```
Dashboard
─────────────
Benutzer
Kurse
  └ Lernpfade
  └ Zertifikate
Mitgliedschaften
Community
  └ Forum
  └ Meldungen
Support
Newsletter
  └ Abonnenten
  └ Segmente
  └ Kampagnen
  └ Automationen
Werkstatt
  └ Produkte
  └ Rezeptdatenbank
  └ Analyse-Profile
Zahlungen
  └ Bestellungen
  └ Rechnungen
Medien
─────────────
Einstellungen
Audit-Log
```

---

## 15. Benachrichtigungen im Admin

| Ereignis | Empfänger |
|----------|-----------|
| Neues Ticket (urgent) | Alle Agenten |
| Fehlgeschlagene Zahlung | Admin |
| Neue Meldung (Forum) | Moderatoren |
| Newsletter Bounce/Complaint | Newsletter-Redakteur |
| Systemfehler | Super-Admin |

---

*Der Adminbereich wird parallel zum Frontend entwickelt und in der Roadmap Phase 2–4 ausgebaut.*
