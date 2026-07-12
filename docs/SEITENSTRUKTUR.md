# Seitenstruktur – Alles-Wurst 2.0

**Version:** 1.0  
**Stand:** Juli 2026  
**Bezug:** `LASTENHEFT.md`, `PFLICHTENHEFT.md`  

---

## 1. Navigationsprinzipien

### 1.1 Hauptnavigation (eingeloggt)

```
Startseite · Akademie · Werkstatt · Community · Meisterclub¹ · Mein Bereich
                                                              [Profil ▾]
```

¹ Nur sichtbar für Meister-Mitglieder

### 1.2 Hauptnavigation (Gast)

```
Startseite · Akademie · Werkstatt · Community · Mitgliedschaft · Anmelden
```

### 1.3 Footer-Navigation

```
Über uns · Kontakt · Support · Newsletter · Impressum · Datenschutz · AGB · Widerruf
```

### 1.4 URL-Konventionen

| Regel | Beispiel |
|-------|----------|
| Kleinbuchstaben, Bindestriche | `/akademie/grundlagen-wurst` |
| Deutsche Slugs | `/werkstatt/salzrechner` |
| Keine IDs in URLs (wo möglich) | `/forum/wurstfehler-beim-fuellen` |
| Admin unter Präfix | `/admin/kurse` |
| API unter Präfix | `/api/v1/...` (später) |

---

## 2. Sitemap (vollständig)

```
/
├── /ueber-uns
├── /kontakt
├── /impressum
├── /datenschutz
├── /agb
├── /widerruf
│
├── /anmelden
├── /registrieren
├── /passwort-vergessen
├── /passwort-zuruecksetzen/{token}
├── /email-bestaetigen/{token}
│
├── /mitgliedschaft
│   ├── /mitgliedschaft/basis
│   ├── /mitgliedschaft/premium
│   └── /mitgliedschaft/meister
│
├── /checkout
│   ├── /checkout/mitgliedschaft/{plan}
│   ├── /checkout/kurs/{slug}
│   └── /checkout/erfolg
│   └── /checkout/abgebrochen
│
├── /akademie
│   ├── /akademie/kurse
│   │   └── /akademie/kurse/{slug}
│   │       ├── /akademie/kurse/{slug}/lernen
│   │       │   └── /akademie/kurse/{slug}/lernen/{lesson-slug}
│   │       ├── /akademie/kurse/{slug}/quiz
│   │       └── /akademie/kurse/{slug}/zertifikat
│   ├── /akademie/lernpfade
│   │   └── /akademie/lernpfade/{slug}
│   └── /akademie/zertifikate
│       └── /zertifikat/verifizieren/{nummer}
│
├── /werkstatt
│   ├── /werkstatt/produkte
│   │   ├── /werkstatt/produkte/{gruppe}
│   │   └── /werkstatt/produkte/vergleich
│   ├── /werkstatt/salzrechner
│   ├── /werkstatt/lakerechner
│   ├── /werkstatt/rezeptgenerator
│   │   ├── /werkstatt/rezeptgenerator/neu
│   │   ├── /werkstatt/rezeptgenerator/{id}
│   │   └── /werkstatt/rezeptgenerator/{id}/analyse
│   ├── /werkstatt/marinaden
│   │   ├── /werkstatt/marinaden/neu
│   │   └── /werkstatt/marinaden/{id}
│   └── /werkstatt/rezeptdatenbank
│       └── /werkstatt/rezeptdatenbank/{id}
│
├── /community
│   ├── /community/feed
│   ├── /community/mitglieder
│   │   └── /community/mitglieder/{username}
│   ├── /forum
│   │   ├── /forum/{kategorie}
│   │   └── /forum/{kategorie}/{thema-slug}
│   └── /nachrichten
│       ├── /nachrichten
│       └── /nachrichten/{conversation-id}
│
├── /meisterclub
│   ├── /meisterclub/uebersicht
│   ├── /meisterclub/inhalte
│   ├── /meisterclub/live-sessions
│   ├── /meisterclub/mentoring
│   └── /meisterclub/rankings
│
├── /support
│   ├── /support
│   ├── /support/neu
│   └── /support/ticket/{nummer}
│
├── /newsletter
│   ├── /newsletter/anmelden
│   ├── /newsletter/bestaetigen/{token}
│   ├── /newsletter/abmelden/{token}
│   └── /newsletter/einstellungen/{token}
│
├── /mein-bereich
│   ├── /mein-bereich (Dashboard)
│   ├── /mein-bereich/kurse
│   ├── /mein-bereich/rezepte
│   ├── /mein-bereich/marinaden
│   ├── /mein-bereich/zertifikate
│   ├── /mein-bereich/mitgliedschaft
│   ├── /mein-bereich/rechnungen
│   ├── /mein-bereich/profil
│   ├── /mein-bereich/einstellungen
│   ├── /mein-bereich/datenschutz
│   └── /mein-bereich/benachrichtigungen
│
└── /admin
    ├── /admin (Dashboard)
    ├── /admin/benutzer
    ├── /admin/kurse
    ├── /admin/mitgliedschaften
    ├── /admin/community
    ├── /admin/support
    ├── /admin/newsletter
    ├── /admin/werkstatt
    ├── /admin/zahlungen
    ├── /admin/medien
    ├── /admin/einstellungen
    └── /admin/audit-log
```

---

## 3. Seitenbeschreibungen

### 3.1 Öffentliche Seiten

#### Startseite `/`
**Zweck:** Conversion, Markenauftritt, Überblick über Angebote  
**Inhalte:**
- Hero mit Claim und CTA (Mitgliedschaft / Kurse)
- Featured Kurse (max. 6)
- Mitgliedschafts-Teaser (3 Pläne)
- Werkstatt-Highlights (Tools + Produkte)
- Community-Statistiken und Testimonials
- Newsletter-Anmeldung
- Footer mit rechtlichen Links

**Zugang:** Öffentlich

---

#### Über uns `/ueber-uns`
**Zweck:** Vertrauensaufbau, Markengeschichte  
**Inhalte:** Mission, Team, Werte, Bildsprache  
**Zugang:** Öffentlich

---

#### Mitgliedschaft `/mitgliedschaft`
**Zweck:** Vergleich und Conversion  
**Inhalte:**
- Drei Pläne im Vergleich (Feature-Matrix)
- FAQ zu Mitgliedschaft
- CTA je Plan → Checkout
- Testimonials Meisterclub

**Zugang:** Öffentlich (Checkout erfordert Login)

---

### 3.2 Authentifizierung

| Seite | Zweck | Besonderheiten |
|-------|-------|----------------|
| `/anmelden` | Login | Redirect nach Login, „Passwort vergessen“-Link |
| `/registrieren` | Neuregistrierung | AGB/Datenschutz-Checkbox, E-Mail-Verifizierung |
| `/passwort-vergessen` | Reset anfordern | E-Mail-Eingabe, Rate Limiting |
| `/passwort-zuruecksetzen/{token}` | Neues Passwort | Token-Gültigkeit 1 h |
| `/email-bestaetigen/{token}` | E-Mail bestätigen | Auto-Login nach Bestätigung |

---

### 3.3 Akademie

#### Kurskatalog `/akademie/kurse`
**Zweck:** Alle Kurse entdecken  
**Inhalte:** Filter (Kategorie, Schwierigkeit, Zugang), Sortierung, Kurskarten  
**Zugang:** Öffentlich (Details mit Vorschau)

#### Kursdetail `/akademie/kurse/{slug}`
**Zweck:** Kursinformationen, Kauf/Einschreibung  
**Inhalte:**
- Titel, Beschreibung, Trailer
- Modul-/Lektionsübersicht (Vorschau-Lektionen markiert)
- Autor, Dauer, Schwierigkeit
- Bewertungen
- CTA: „Kurs starten“ / „Jetzt kaufen“ / „Mitglied werden“

#### Kurs-Player `/akademie/kurse/{slug}/lernen/{lesson-slug}`
**Zweck:** Lektion absolvieren  
**Inhalte:**
- Video-Player / Text / PDF je Lektionstyp
- Seitennavigation (Module, Lektionen)
- Fortschrittsanzeige
- „Als abgeschlossen markieren“ / Auto-Complete bei Video-Ende
- Link zum Kurs-Quiz (wenn alle Lektionen abgeschlossen)

#### Quiz `/akademie/kurse/{slug}/quiz`
**Zweck:** Abschlussquiz  
**Inhalte:** Fragen, Timer (optional), Ergebnis, Wiederholung  
**Zugang:** Eingeschriebene Kursteilnehmer

#### Zertifikat `/akademie/kurse/{slug}/zertifikat`
**Zweck:** Zertifikat anzeigen und herunterladen  
**Inhalte:** Zertifikatsansicht, PDF-Download, Teilen-Link  
**Zugang:** Nach bestandenem Quiz

#### Lernpfade `/akademie/lernpfade`
**Zweck:** Thematische Kurspfade  
**Inhalte:** Pfade mit Fortschritt (wenn eingeloggt)  
**Zugang:** Öffentlich

#### Zertifikat-Verifikation `/zertifikat/verifizieren/{nummer}`
**Zweck:** Öffentliche Prüfung eines Zertifikats  
**Inhalte:** Name, Kurs, Datum, Status  
**Zugang:** Öffentlich

---

### 3.4 Werkstatt

| Seite | Zweck | Zugang |
|-------|-------|--------|
| `/werkstatt` | Übersicht aller Tools | Öffentlich |
| `/werkstatt/produkte` | Affiliate-Katalog | Öffentlich |
| `/werkstatt/salzrechner` | Salzberechnung | Öffentlich |
| `/werkstatt/lakerechner` | Lake-Berechnung | Premium+ |
| `/werkstatt/rezeptgenerator` | Rezeptliste | Basis+ (eingeschränkt) |
| `/werkstatt/rezeptgenerator/neu` | Rezept erstellen | Basis+ |
| `/werkstatt/rezeptgenerator/{id}` | Rezept bearbeiten | Besitzer |
| `/werkstatt/rezeptgenerator/{id}/analyse` | Meisterwerkstatt | Meister |
| `/werkstatt/marinaden` | Marinadenliste | Premium+ |
| `/werkstatt/rezeptdatenbank` | Gemeinsame Rezepte | Premium+ (lesen) |

**Gemeinsame UI-Elemente Werkstatt:**
- Breadcrumb: Werkstatt → Tool
- Sidebar mit Tool-Navigation
- Upgrade-Hinweis bei gesperrten Tools
- Affiliate-Disclosure bei Produktseiten

---

### 3.5 Community

#### Community-Start `/community`
**Zweck:** Einstieg in Community-Bereich  
**Inhalte:** Aktivitätsfeed, beliebte Themen, neue Mitglieder  
**Zugang:** Basis+

#### Forum `/forum`
**Zweck:** Diskussionsplattform  
**Struktur:**
- Kategorieliste mit Themenanzahl, letzter Aktivität
- Kategorie-Seite: Themenliste mit Pagination
- Thema-Seite: Eröffnungsbeitrag + Antworten (threaded)
- Aktionen: Neues Thema, Antworten, Melden, Lösung markieren

**Kategorien (Standard):**
| Kategorie | Zugang |
|-----------|--------|
| Vorstellung | Basis+ |
| Wurstherstellung | Basis+ |
| Räuchern & Pökeln | Basis+ |
| Rezepte & Tipps | Basis+ |
| Geräte & Ausrüstung | Öffentlich (lesen) |
| Meisterclub Austausch | Meister |
| Kurs-Diskussionen | Dynamisch pro Kurs |

#### Mitgliederprofile `/community/mitglieder/{username}`
**Zweck:** Öffentliches Profil  
**Inhalte:** Avatar, Bio, Badges, Kurse, Forum-Beiträge (je Sichtbarkeit), Rezepte (wenn öffentlich)  
**Zugang:** Je nach `profile_visibility`

#### Direktnachrichten `/nachrichten`
**Zweck:** Private Kommunikation  
**Inhalte:**
- Konversationsliste (links)
- Nachrichtenverlauf (rechts)
- Neue Nachricht verfassen
- Ungelesen-Indikator

**Zugang:** Basis+

---

### 3.6 Meisterclub

| Seite | Inhalt | Zugang |
|-------|--------|--------|
| `/meisterclub` | Willkommen, Übersicht exklusiver Features | Meister |
| `/meisterclub/inhalte` | Exklusive Artikel, Videos, Downloads | Meister |
| `/meisterclub/live-sessions` | Terminliste, Aufzeichnungen | Meister |
| `/meisterclub/mentoring` | Mentoring-Anfrage-Formular, Status | Meister |
| `/meisterclub/rankings` | Rezept-Rankings (Analyse-Scores) | Meister |

---

### 3.7 Support

| Seite | Zweck | Zugang |
|-------|-------|--------|
| `/support` | Ticket-Übersicht (eigene) | Eingeloggt |
| `/support/neu` | Neues Ticket erstellen | Eingeloggt |
| `/support/ticket/{nummer}` | Ticket-Detail mit Verlauf | Eigentümer + Agenten |

---

### 3.8 Newsletter (öffentlich)

| Seite | Zweck |
|-------|-------|
| `/newsletter/anmelden` | Anmeldeformular (auch eingebettet) |
| `/newsletter/bestaetigen/{token}` | DOI-Bestätigung |
| `/newsletter/abmelden/{token}` | Ein-Klick-Abmeldung |
| `/newsletter/einstellungen/{token}` | Interessen, Frequenz ändern |

---

### 3.9 Mein Bereich (Mitglieder-Dashboard)

#### Dashboard `/mein-bereich`
**Zweck:** Persönliche Übersicht  
**Widgets:**
- Willkommensnachricht
- Kursfortschritt (aktive Kurse)
- Letzte Forum-Aktivität
- Ungelesene Nachrichten
- Mitgliedschaftsstatus
- Schnellzugriff Werkstatt-Tools

#### Weitere Unterseiten

| Seite | Inhalt |
|-------|--------|
| `/mein-bereich/kurse` | Alle eingeschriebenen Kurse mit Fortschritt |
| `/mein-bereich/rezepte` | Eigene Rezepte |
| `/mein-bereich/marinaden` | Eigene Marinaden |
| `/mein-bereich/zertifikate` | Erhaltene Zertifikate |
| `/mein-bereich/mitgliedschaft` | Aktueller Plan, Upgrade, Kündigung |
| `/mein-bereich/rechnungen` | Rechnungshistorie, PDF-Download |
| `/mein-bereich/profil` | Profil bearbeiten |
| `/mein-bereich/einstellungen` | Passwort, 2FA, Sprache |
| `/mein-bereich/datenschutz` | Datenexport, Kontolöschung |
| `/mein-bereich/benachrichtigungen` | Benachrichtigungseinstellungen |

---

## 4. Layout-Templates

| Template | Verwendung |
|----------|------------|
| `MarketingLayout` | Startseite, Über uns, Mitgliedschaft |
| `AuthLayout` | Login, Registrierung, Passwort |
| `AppLayout` | Eingeloggter Bereich (Nav + Sidebar) |
| `CoursePlayerLayout` | Kurs-Player (fokussiert, minimale Ablenkung) |
| `WerkstattLayout` | Tools (Sidebar-Navigation) |
| `ForumLayout` | Forum (Breadcrumb, Kategorien) |
| `AdminLayout` | Admin-Panel (eigene Sidebar) |
| `MinimalLayout` | Checkout, Newsletter-Bestätigung |

---

## 5. Responsive Verhalten

| Breakpoint | Verhalten |
|------------|-----------|
| < 768px | Hamburger-Menü, gestapelte Karten, vereinfachter Kurs-Player |
| 768–1024px | Kollabierte Sidebar, 2-spaltige Grids |
| > 1024px | Volle Navigation, 3-spaltige Grids, Sidebar sichtbar |

**Mobile Prioritäten:**
- Kurs-Player: Vollbild-Video
- Rezeptgenerator: Schritt-für-Schritt-Wizard
- Forum: Flache Antwortliste (kein tiefes Threading)
- Checkout: Einspaltig, große Touch-Targets

---

## 6. SEO und Meta

| Seite | Title-Pattern | Indexierung |
|-------|---------------|-------------|
| Startseite | Alles-Wurst – THE CREST OF CRAFTSMANSHIP | index |
| Kurs | {Kurstitel} – Alles-Wurst Akademie | index |
| Forum-Thema | {Titel} – Forum – Alles-Wurst | index (öffentliche Kategorien) |
| Werkstatt-Tools | {Tool} – Werkstatt – Alles-Wurst | index |
| Mein Bereich | noindex | noindex |
| Admin | noindex, nofollow | noindex |
| Checkout | noindex | noindex |

---

## 7. Fehlerseiten

| Seite | Inhalt |
|-------|--------|
| `/404` | Seite nicht gefunden, Suche, Links zu Akademie/Werkstatt |
| `/403` | Kein Zugriff, Upgrade-Hinweis oder Login-Aufforderung |
| `/500` | Serverfehler, Support-Link |
| `/wartung` | Wartungsmodus (konfigurierbar im Admin) |

---

*Die Seitenstruktur ist die Grundlage für Wireframes und UI-Design im nächsten Planungsschritt.*
