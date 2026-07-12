# Kurssystem – Alles-Wurst 2.0

**Version:** 1.0  
**Stand:** Juli 2026  
**Bezug:** `DATENMODELL.md`, `MITGLIEDSCHAFTEN.md`, `ROLLENMODELL.md`  

---

## 1. Übersicht

Das Kurssystem (Akademie) ist das edukative Herzstück der Plattform. Es ermöglicht strukturiertes Lernen durch Kurse, Module und Lektionen mit Fortschrittsverfolgung, Abschlussquizzes und Zertifikaten.

### 1.1 Ziele

- Strukturierte Wissensvermittlung von Einsteiger- bis Meister-Niveau
- Messbarer Lernfortschritt mit Abschlussnachweis
- Flexible Zugangsmodelle (Mitgliedschaft, Einzelkauf, kostenlos)
- Integration mit Community, Newsletter und Meisterclub

### 1.2 Hierarchie

```
Lernpfad (optional)
    └── Kurs
            └── Modul
                    └── Lektion
                            └── Quiz (optional, Abschluss)
```

---

## 2. Lernpfade

### 2.1 Konzept

Lernpfade gruppieren thematisch zusammengehörige Kurse in einer empfohlenen Reihenfolge. Sie helfen Nutzern, einen strukturierten Lernweg zu folgen.

### 2.2 Standard-Lernpfade

| Pfad | Schwierigkeit | Kurse (Beispiel) |
|------|---------------|------------------|
| Wurst-Einsteiger | Beginner | Grundlagen, Erste Wurst, Gewürze |
| Bratwurst-Meister | Intermediate | Bratwurst-Techniken, Varianten, Grill |
| Rohwurst-Spezialist | Advanced | Rohwurst, Fermentation, Reifung |
| Räucher-Profi | Advanced | Kalt-/Heißräuchern, Räucherprogramme |
| Pökel & Lake | Intermediate | Pökelfleisch, Lake-Techniken |
| Wildverarbeitung | Advanced | Wild zerlegen, Wildwurst |
| Meister-Programm | Master | Alle Advanced-Kurse + Mentoring |

### 2.3 Lernpfad-Attribute

| Attribut | Beschreibung |
|----------|--------------|
| Titel, Slug | Name und URL |
| Beschreibung | Ausführliche Einleitung |
| Thumbnail | Vorschaubild |
| Schwierigkeit | Gesamtschwierigkeit |
| Geschätzte Dauer | Summe der Kursdauern |
| Kurse | Geordnete Liste mit `sort_order` |

### 2.4 Fortschritt im Lernpfad

- Berechnung: Abgeschlossene Kurse / Gesamtkurse × 100 %
- Anzeige im Nutzer-Dashboard und auf Lernpfad-Detailseite
- Abschluss-Badge bei 100 %

---

## 3. Kurse

### 3.1 Kurs-Lebenszyklus

```
Entwurf → Review → Veröffentlicht → Archiviert
```

| Status | Beschreibung |
|--------|--------------|
| `draft` | In Bearbeitung, nur Autor/Admin sichtbar |
| `review` | Zur Freigabe eingereicht |
| `published` | Öffentlich sichtbar und buchbar |
| `archived` | Nicht mehr buchbar, bestehende Teilnehmer behalten Zugang |

### 3.2 Kurs-Attribute

| Attribut | Pflicht | Beschreibung |
|----------|---------|--------------|
| Titel | Ja | Kurstitel |
| Slug | Ja | URL-freundlich, eindeutig |
| Untertitel | Nein | Kurze Ergänzung |
| Beschreibung | Ja | Ausführliche Kursbeschreibung (Rich Text) |
| Thumbnail | Ja | Vorschaubild (16:9) |
| Trailer-Video | Nein | Vimeo/Bunny-Embed |
| Autor | Ja | Kursautor (User) |
| Kategorie | Ja | z. B. Wurst, Räuchern, Pökeln |
| Schwierigkeit | Ja | beginner / intermediate / advanced / master |
| Dauer | Auto | Summe Lektionsdauern |
| Sprache | Ja | de (default) |

### 3.3 Zugangsmodelle

| Typ | Beschreibung | Beispiel |
|-----|--------------|----------|
| `free` | Kostenlos für alle | Grundlagen-Einführung |
| `membership` | Nur über Mitgliedschaft | Premium-Kurse |
| `purchase` | Einzelkauf | Spezialkurs 29,90 € |
| `membership_or_purchase` | Mitgliedschaft oder Kauf | Flexibles Modell |

**Zusatzregeln:**
- `required_membership_levels`: z. B. nur `premium`, `meister`
- `early_access_levels`: Frühzugang für Meister (z. B. 14 Tage vor Release)
- `price`: Einzelpreis bei `purchase` oder `membership_or_purchase`

### 3.4 Kurs-Kategorien

| Kategorie | Slug | Beschreibung |
|-----------|------|--------------|
| Grundlagen | grundlagen | Einstieg, Basiswissen |
| Wurstherstellung | wurst | Verschiedene Wurstarten |
| Räuchern | raeuchern | Räuchertechniken |
| Pökeln & Lake | poekeln | Pökelfleisch, Lakes |
| Wild | wild | Wildverarbeitung |
| Geräte & Technik | geraete | Ausrüstung, Wartung |
| Recht & Hygiene | hygiene | HACCP, Lebensmittelrecht |
| Spezial | spezial | Nischen-Themen |

---

## 4. Module

### 4.1 Struktur

Ein Kurs besteht aus 3–8 Modulen. Jedes Modul gruppiert thematisch zusammengehörige Lektionen.

**Beispiel: Kurs „Bratwurst-Meister“**

| Modul | Lektionen |
|-------|-----------|
| 1. Einführung | Willkommen, Zutaten, Equipment |
| 2. Fleisch & Fett | Fleischwahl, Fettanteil, Mahlen |
| 3. Gewürze | Gewürzmischungen, Dosierung |
| 4. Herstellung | Mischen, Füllen, Formen |
| 5. Zubereitung | Braten, Grillen, Servieren |
| 6. Abschluss | Quiz, Zertifikat |

### 4.2 Modul-Attribute

| Attribut | Beschreibung |
|----------|--------------|
| Titel | Modultitel |
| Beschreibung | Kurze Einleitung (optional) |
| sort_order | Position im Kurs |
| Lektionen | Geordnete Liste |

---

## 5. Lektionen

### 5.1 Lektionstypen

| Typ | Beschreibung | Inhalt |
|-----|--------------|--------|
| `video` | Video-Lektion | Video-URL, Dauer, Transkript (optional) |
| `text` | Text-Lektion | Rich Text (HTML/Markdown) |
| `pdf` | PDF-Download | PDF-Datei, Begleittext |
| `quiz` | Wissenscheck | Eingebettetes Quiz (nicht Abschluss) |
| `assignment` | Aufgabe | Beschreibung, optional Upload (Phase 2) |

### 5.2 Lektion-Attribute

| Attribut | Beschreibung |
|----------|--------------|
| Titel | Lektionstitel |
| Typ | Lektionstyp |
| Inhalt | Je nach Typ |
| sort_order | Position im Modul |
| is_preview | Kostenlose Vorschau (auch ohne Zugang) |
| is_required | Pflicht für Kursabschluss |
| Dauer | Geschätzte/gemessene Dauer |

### 5.3 Video-Lektionen

- Hosting: Extern (Vimeo, Bunny Stream) oder Self-Hosted (CDN)
- Player: Custom Player mit Branding
- Features:
  - Fortsetzen bei letzter Position
  - Geschwindigkeitssteuerung (0.5x–2x)
  - Untertitel (VTT)
  - Kapitelmarken (optional)
  - Auto-Complete bei 90 % angesehen

### 5.4 Text-Lektionen

- Rich-Text-Editor im Admin
- Unterstützte Elemente: Überschriften, Listen, Bilder, Videos (Embed), Tabellen, Code
- Bilder aus Medienbibliothek
- Druckfreundliches Layout

---

## 6. Quiz-System

### 6.1 Quiz-Typen

| Typ | Verwendung |
|-----|------------|
| Lektions-Quiz | Wissenscheck innerhalb einer Lektion |
| Abschluss-Quiz | Pflicht für Kursabschluss und Zertifikat |

### 6.2 Fragentypen

| Typ | Beschreibung |
|-----|--------------|
| `single_choice` | Eine richtige Antwort |
| `multiple_choice` | Mehrere richtige Antworten |
| `true_false` | Wahr/Falsch |

### 6.3 Quiz-Attribute

| Attribut | Beschreibung |
|----------|--------------|
| Titel | Quiz-Titel |
| pass_percentage | Bestehensgrenze (default: 80 %) |
| max_attempts | Max. Versuche (null = unbegrenzt) |
| time_limit_minutes | Zeitlimit (optional) |
| shuffle_questions | Fragen zufällig mischen |
| shuffle_options | Antworten zufällig mischen |
| show_explanations | Erklärungen nach Beantwortung |

### 6.4 Abschluss-Quiz-Workflow

```
Alle Pflichtlektionen abgeschlossen
        ↓
Quiz verfügbar
        ↓
Nutzer startet Quiz
        ↓
    ┌───────────────────┐
    │ Bestanden (≥80%)  │ → Zertifikat ausgestellt
    └───────────────────┘
    │ Nicht bestanden   │ → Wiederholung (wenn Versuche übrig)
    └───────────────────┘
```

### 6.5 Fragen-Beispiel (Abschluss-Quiz Bratwurst)

| # | Frage | Typ | Antworten |
|---|-------|-----|-----------|
| 1 | Welcher Fettanteil ist für Bratwurst ideal? | single | 20–25 % (richtig), 5–10 %, 40–50 % |
| 2 | Welche Gewürze gehören in klassische Bratwurst? | multiple | Salz, Pfeffer, Majoran (richtig), Zimt |
| 3 | Bratwurst muss vor dem Verzehr gegart werden. | true_false | Wahr (richtig) |

---

## 7. Fortschrittsverfolgung

### 7.1 Enrollment (Einschreibung)

Auslöser:
- Mitgliedschaft mit Kurszugang
- Einzelkurskauf
- Manuelle Zuweisung (Admin)
- Geschenk (Phase 2)

### 7.2 Fortschrittsberechnung

```
Fortschritt = Abgeschlossene Pflichtlektionen / Gesamte Pflichtlektionen × 100 %
```

- Nur `is_required = true` Lektionen zählen
- Quiz-Lektionen: Abgeschlossen wenn Quiz bestanden

### 7.3 Lektionsfortschritt

| Status | Bedingung |
|--------|-----------|
| `not_started` | Noch nicht geöffnet |
| `in_progress` | Geöffnet, nicht abgeschlossen |
| `completed` | Manuell oder automatisch abgeschlossen |

**Auto-Complete-Regeln:**
- Video: 90 % angesehen
- Text: Scroll bis Ende (oder Button „Gelesen“)
- PDF: Download oder Button „Gelesen“
- Quiz: Bestanden

### 7.4 Anzeige

- Kurskarte: Fortschrittsbalken (0–100 %)
- Kurs-Player: Modul-/Lektionsstatus (✓, ○, 🔒)
- Dashboard: Aktive Kurse mit Fortschritt

---

## 8. Zertifikate

### 8.1 Ausstellungsbedingungen

1. Alle Pflichtlektionen abgeschlossen
2. Abschluss-Quiz bestanden (≥ konfigurierte Mindestpunktzahl)
3. Kurs hat `certificate_enabled = true`

### 8.2 Zertifikat-Inhalt

| Element | Beschreibung |
|---------|--------------|
| Logo | Alles-Wurst Wappen |
| Titel | „Zertifikat“ |
| Text | „Hiermit wird bestätigt, dass [Name] den Kurs [Kursname] erfolgreich abgeschlossen hat.“ |
| Datum | Abschlussdatum |
| Zertifikatsnummer | AW-CERT-2026-00001 |
| QR-Code | Link zur Verifikation |
| Unterschrift | Grafische Unterschrift / Siegel |
| Design | Playfair Display, Gold-Akzent, hochwertig |

### 8.3 Verifikation

- Öffentliche URL: `/zertifikat/verifizieren/{nummer}`
- Anzeige: Name, Kurs, Datum, Status (gültig/widerrufen)
- Keine sensiblen Daten (E-Mail, Adresse)

### 8.4 Widerruf

- Admin kann Zertifikat widerrufen (mit Begründung)
- Status ändert sich auf „widerrufen“
- PDF bleibt abrufbar, zeigt Status

---

## 9. Kursbewertungen

### 9.1 Bewertungssystem

- Nur nach Kursabschluss
- 1–5 Sterne + optionaler Text
- Durchschnitt auf Kursdetailseite
- Admin kann Bewertungen moderieren

### 9.2 Anzeige

- Kurskarte: Durchschnittssterne
- Kursdetail: Bewertungsliste mit Pagination

---

## 10. Integrationen

### 10.1 Mitgliedschaften

| Mitgliedschaft | Kurszugang |
|----------------|------------|
| Basis | Kurse mit `required_membership_levels` enthält `basis` oder kostenlos |
| Premium | + Premium-Kurse |
| Meister | + alle Kurse, Frühzugang |

### 10.2 Community

- Pro Kurs optionale Forum-Kategorie
- Kursabschluss → Badge im Profil
- Kursabschluss → Aktivität im Feed

### 10.3 Newsletter

| Trigger | Aktion |
|---------|--------|
| Kurs gekauft | Willkommens-E-Mail mit Kurslink |
| Kurs begonnen | Erinnerung nach 7 Tagen Inaktivität |
| Kurs abgeschlossen | Glückwunsch + Zertifikat-Link |
| Quiz nicht bestanden | Ermutigung + Tipps |

### 10.4 Meisterclub

- Frühzugang zu neuen Kursen (konfigurierbar)
- Exklusive Kurse nur für Meister
- Live-Sessions zu Kursinhalten

---

## 11. Kursautor-Workflow

### 11.1 Kurs erstellen

1. Admin/Kursautor: Neuer Kurs → Entwurf
2. Grunddaten ausfüllen
3. Module und Lektionen anlegen
4. Abschluss-Quiz erstellen
5. Vorschau prüfen
6. Zur Review einreichen (wenn Autor ≠ Admin)
7. Admin gibt frei → Veröffentlicht

### 11.2 Berechtigungen

| Aktion | Kursautor | Admin |
|--------|-----------|-------|
| Eigenen Kurs erstellen | ✓ | ✓ |
| Eigenen Kurs bearbeiten | ✓ | ✓ |
| Fremden Kurs bearbeiten | – | ✓ |
| Kurs veröffentlichen | – | ✓ |
| Kurs löschen | Eigene (Entwurf) | ✓ |

---

## 12. Reporting (Admin)

| Metrik | Beschreibung |
|--------|--------------|
| Einschreibungen | Pro Kurs, Zeitraum |
| Abschlussrate | Abgeschlossen / Eingeschrieben |
| Durchschnittliche Dauer | Zeit bis Abschluss |
| Quiz-Erfolgsrate | Bestanden / Versuche |
| Bewertungsdurchschnitt | Pro Kurs |
| Drop-off | Lektion mit häufigstem Abbruch |

---

## 13. Migration (WordPress/LearnPress)

| LearnPress | Alles-Wurst 2.0 |
|------------|-----------------|
| lp_course | Course |
| lp_section | Module |
| lp_lesson | Lesson |
| lp_quiz | Quiz |
| lp_question | QuizQuestion |
| lp_user_item | Enrollment + LessonProgress |

**Besonderheiten:**
- LearnPress-Metadaten in `metadata` JSON
- Video-URLs übernehmen
- Fortschritt migrieren (best effort)

---

*Das Kurssystem wird in Roadmap Phase 2 implementiert.*
