# Community – Alles-Wurst 2.0

**Version:** 1.0  
**Stand:** Juli 2026  
**Bezug:** `ROLLENMODELL.md`, `MITGLIEDSCHAFTEN.md`, `DATENMODELL.md`  

---

## 1. Übersicht

Die Community ist das soziale Herzstück der Plattform. Sie verbindet Mitglieder durch Profile, Forum, Direktnachrichten und einen Aktivitätsfeed. Zusätzlich umfasst dieses Dokument das **Support-Ticketsystem** als serviceorientierten Teil der Mitgliederbetreuung.

### 1.1 Ziele

- Austausch von Wissen und Erfahrungen
- Vernetzung gleichgesinnter Hobbywurstler
- Schnelle Hilfe bei Fragen (Forum + Support)
- Reputation und Anerkennung (Badges)
- Bindung an die Plattform

### 1.2 Zugang

| Bereich | Mindest-Mitgliedschaft |
|---------|------------------------|
| Forum (öffentliche Kategorien lesen) | Gast |
| Forum (Mitglieder-Kategorien) | Basis |
| Forum beitragen | Basis |
| Direktnachrichten | Basis |
| Profil | Basis |
| Meisterclub-Forum | Meister |

---

## 2. Mitgliederprofile

### 2.1 Profil-Attribute

| Attribut | Sichtbarkeit | Beschreibung |
|----------|--------------|--------------|
| Anzeigename | Konfigurierbar | Öffentlicher Name |
| Avatar | Konfigurierbar | Profilbild (Upload oder Gravatar) |
| Bio | Konfigurierbar | Kurzbeschreibung (max. 500 Zeichen) |
| Mitglied seit | Öffentlich | Registrierungsdatum |
| Mitgliedschaft | Öffentlich | Aktueller Plan (Badge) |
| Badges | Öffentlich | Erhaltene Auszeichnungen |
| Kurse abgeschlossen | Konfigurierbar | Anzahl / Liste |
| Forum-Beiträge | Konfigurierbar | Anzahl |
| Rezepte (öffentlich) | Konfigurierbar | Veröffentlichte Rezepte |
| Standort | Konfigurierbar | Optional (Stadt/Region) |
| Website | Konfigurierbar | Optional |

### 2.2 Sichtbarkeitseinstellungen

| Stufe | Beschreibung |
|-------|--------------|
| `public` | Für alle sichtbar (auch Gäste) |
| `members_only` | Nur eingeloggte Mitglieder |
| `private` | Nur für den Nutzer selbst |

### 2.3 Profil-URL

`/community/mitglieder/{username}`

Username: Eindeutig, 3–30 Zeichen, alphanumerisch + Unterstrich, bei Registrierung wählbar.

### 2.4 Profil-Badges

| Badge | Auslöser |
|-------|----------|
| 🎓 Kurs-Absolvent | Erster Kurs abgeschlossen |
| 🏆 Meister-Zertifikat | Meister-Programm abgeschlossen |
| 💬 Forum-Contributor | 10+ Forum-Beiträge |
| ⭐ Top-Helfer | 5+ als Lösung markierte Antworten |
| 🥩 Rezept-Meister | Rezept in Datenbank veröffentlicht |
| 👑 Meisterclub | Meister-Mitgliedschaft |

---

## 3. Forum

### 3.1 Struktur

```
Forum
├── Kategorie 1
│   ├── Thema 1
│   │   ├── Eröffnungsbeitrag
│   │   ├── Antwort 1
│   │   └── Antwort 2 (Antwort auf 1)
│   └── Thema 2
└── Kategorie 2
    └── ...
```

### 3.2 Kategorien (Standard)

| Kategorie | Slug | Zugang | Beschreibung |
|-----------|------|--------|--------------|
| Vorstellung | vorstellung | Basis+ | Neue Mitglieder stellen sich vor |
| Wurstherstellung | wurst | Basis+ | Allgemeine Wurstfragen |
| Bratwurst | bratwurst | Basis+ | Bratwurst-spezifisch |
| Rohwurst | rohwurst | Basis+ | Rohwurst, Fermentation |
| Räuchern | raeuchern | Basis+ | Räuchertechniken |
| Pökeln & Lake | poekeln | Basis+ | Pökelfleisch, Lakes |
| Rezepte & Tipps | rezepte | Basis+ | Rezepte teilen, Tipps |
| Geräte & Ausrüstung | geraete | Öffentlich (lesen) | Equipment-Diskussionen |
| Wildverarbeitung | wild | Premium+ | Wild, Jagd |
| Meisterclub | meisterclub | Meister | Exklusiver Austausch |
| Kurs: {Kursname} | kurs-{slug} | Kursteilnehmer | Kurs-spezifische Diskussion |

### 3.3 Themen

**Erstellen:**
- Titel (max. 200 Zeichen)
- Inhalt (Rich Text, max. 50.000 Zeichen)
- Kategorie wählen
- Optional: Tags

**Anzeige:**
- Titel, Autor, Erstellungsdatum
- Antwortanzahl, Aufrufe
- Letzte Aktivität
- Status: Offen, Gelöst, Gesperrt, Angepinnt

### 3.4 Antworten

- Rich-Text-Editor (einfacher als Thema)
- Verschachtelung: 1 Ebene (Antwort auf Antwort)
- Zitieren (Quote)
- Als Lösung markieren (nur Themen-Ersteller oder Moderator)
- Bearbeiten (eigene, innerhalb 30 Min.)
- Melden

### 3.5 Forum-Aktionen

| Aktion | Wer |
|--------|-----|
| Thema erstellen | Basis+ |
| Antworten | Basis+ |
| Eigenen Beitrag bearbeiten | Autor (30 Min.) |
| Als Lösung markieren | Themen-Ersteller, Moderator |
| Thema anpinnen | Moderator, Admin |
| Thema sperren | Moderator, Admin |
| Beitrag löschen | Autor (eigene), Moderator, Admin |
| Nutzer verwarnen | Moderator, Admin |

### 3.6 Benachrichtigungen

| Ereignis | Benachrichtigung |
|----------|------------------|
| Antwort auf eigenes Thema | E-Mail + In-App |
| Antwort auf beobachtetes Thema | In-App |
| Erwähnung (@username) | E-Mail + In-App |
| Lösung markiert | In-App |

### 3.7 Suche

- Volltextsuche über Themen und Antworten
- Filter: Kategorie, Autor, Zeitraum
- Hervorhebung Treffer

---

## 4. Direktnachrichten

### 4.1 Konzept

Private 1:1-Kommunikation zwischen Mitgliedern. Keine Gruppenchats in Phase 1.

### 4.2 Funktionen

| Funktion | Beschreibung |
|----------|--------------|
| Konversation starten | Empfänger suchen (Username) |
| Nachricht senden | Text, max. 5.000 Zeichen |
| Anhang | Bild, PDF (max. 5 MB) |
| Lesen-Status | Gelesen/Ungelesen |
| Konversation löschen | Soft-Delete (eigene Sicht) |
| Nutzer blockieren | Keine Nachrichten mehr |

### 4.3 UI

**Konversationsliste (`/nachrichten`):**
- Empfänger (Avatar, Name)
- Letzte Nachricht (Vorschau)
- Ungelesen-Indikator
- Sortierung: Neueste zuerst

**Konversationsansicht (`/nachrichten/{id}`):**
- Nachrichtenverlauf (chronologisch)
- Eingabefeld unten
- Empfänger-Profil-Link

### 4.4 Einschränkungen

- Nur an registrierte Mitglieder (Basis+)
- Rate Limiting: max. 50 Nachrichten/Tag (Anti-Spam)
- Blockierte Nutzer können nicht angeschrieben werden
- Melden-Funktion für unangemessene Inhalte

### 4.5 Benachrichtigungen

- Neue Nachricht: In-App (sofort), E-Mail (gebündelt, max. 1×/Stunde)

---

## 5. Aktivitätsfeed

### 5.1 Konzept

Chronologische Übersicht relevanter Community-Aktivitäten.

### 5.2 Aktivitätstypen

| Typ | Beispiel |
|-----|----------|
| `course_completed` | „Max hat den Kurs Bratwurst-Meister abgeschlossen“ |
| `recipe_published` | „Anna hat ein Rezept veröffentlicht: Landjäger“ |
| `forum_topic` | „Tom hat ein neues Thema erstellt: Pökelsalz-Frage“ |
| `badge_earned` | „Lisa hat das Badge Forum-Contributor erhalten“ |
| `member_joined` | „Neues Mitglied: Stefan“ |

### 5.3 Feed-Quellen

- Eigene Aktivitäten
- Gefolgte Mitglieder (optional, Phase 2)
- Globale Highlights (Admin-kuratiert)

### 5.4 Datenschutz

- Nutzer kann Aktivitätstypen einzeln deaktivieren
- Profil-Sichtbarkeit beeinflusst Feed-Sichtbarkeit

---

## 6. Moderation

### 6.1 Meldesystem

**Meldegründe:**
- Spam
- Belästigung
- Off-Topic
- Unangemessener Inhalt
- Sonstiges (Freitext)

**Workflow:**
1. Nutzer meldet Beitrag/Nachricht/Profil
2. Meldung erscheint in Admin-Queue
3. Moderator prüft
4. Aktion: Abweisen, Verwarnen, Beitrag löschen, Nutzer sperren
5. Melder erhält Rückmeldung (optional)

### 6.2 Moderations-Aktionen

| Aktion | Beschreibung | Dauer |
|--------|--------------|-------|
| Verwarnung | E-Mail an Nutzer | – |
| Beitrag löschen | Soft-Delete | Permanent |
| Thema sperren | Keine neuen Antworten | Permanent |
| Nutzer stummschalten | Kein Posting | 1–30 Tage |
| Nutzer sperren (Forum) | Kein Forum-Zugang | 1–90 Tage |
| Nutzer sperren (Plattform) | Login gesperrt | Permanent |

### 6.3 Automatische Moderation (Phase 2)

- Spam-Erkennung (Links, Wiederholungen)
- Wortfilter (konfigurierbar)
- Rate Limiting

---

## 7. Support-Ticketsystem

### 7.1 Übersicht

Das Support-System ermöglicht strukturierte Anfragen von Mitgliedern und effiziente Bearbeitung durch Support-Agenten.

### 7.2 Ticket-Kategorien

| Kategorie | Slug | Beschreibung |
|-----------|------|--------------|
| Technisches Problem | `technical` | Login, Bugs, Darstellungsfehler |
| Zahlung & Rechnung | `billing` | Zahlungsprobleme, Rechnungsfragen |
| Kursinhalt | `course_content` | Fragen zu Kursinhalten |
| Mitgliedschaft | `membership` | Abo, Upgrade, Kündigung |
| Werkstatt-Tools | `tools` | Rechner, Generator, Analyse |
| Sonstiges | `other` | Alles andere |

### 7.3 Ticket-Prioritäten

| Priorität | SLA (Erstreaktion) | Anwendung |
|-----------|-------------------|-----------|
| `urgent` | 4 Stunden | Zahlung fehlgeschlagen, Login gesperrt |
| `high` | 8 Stunden | Kurszugang fehlt |
| `normal` | 24 Stunden | Standard |
| `low` | 48 Stunden | Allgemeine Fragen |

### 7.4 Ticket-Status

```
new → seen → in_progress → waiting → resolved → closed
                    ↑___________|
```

| Status | Beschreibung |
|--------|--------------|
| `new` | Neu erstellt, ungelesen |
| `seen` | Von Agent gesehen |
| `in_progress` | In Bearbeitung |
| `waiting` | Warten auf Nutzer-Rückmeldung |
| `resolved` | Gelöst, wartet auf Bestätigung |
| `closed` | Abgeschlossen |

### 7.5 Ticket-Erstellung

**Formular (`/support/neu`):**
- Betreff (Pflicht)
- Kategorie (Pflicht)
- Priorität (automatisch oder manuell)
- Beschreibung (Pflicht, Rich Text)
- Anhänge (optional, max. 3 × 10 MB)

**Nach Erstellung:**
- Ticket-Nummer: AW-TKT-2026-00001
- Bestätigungs-E-Mail
- Benachrichtigung an Agenten (bei urgent/high)

### 7.6 Ticket-Bearbeitung (Agent)

**Ticket-Detail (`/admin/support/ticket/{nummer}`):**
- Vollständiger Verlauf
- Nutzer-Info (Sidebar): Profil, Mitgliedschaft, letzte Tickets
- Antworten (öffentlich oder interne Notiz)
- Status ändern
- Agent zuweisen
- Priorität ändern
- Kollisionswarnung

### 7.7 E-Mail-Benachrichtigungen

| Ereignis | Empfänger |
|----------|-----------|
| Ticket erstellt | Nutzer (Bestätigung), Agenten (bei urgent) |
| Agent antwortet | Nutzer |
| Nutzer antwortet | Zugewiesener Agent |
| Status → resolved | Nutzer (Bitte um Bestätigung) |
| Status → closed | Nutzer (Abschluss) |

### 7.8 Nutzer-Ticket-Übersicht (`/support`)

- Liste eigener Tickets
- Filter: Status, Kategorie
- Sortierung: Neueste zuerst
- Schnellaktion: Neues Ticket

### 7.9 Statistiken (Admin)

| Metrik | Beschreibung |
|--------|--------------|
| Offene Tickets | Nach Priorität |
| Durchschnittliche Lösungszeit | Pro Kategorie |
| Agent-Auslastung | Tickets pro Agent |
| Kundenzufriedenheit | Optional: Bewertung nach Abschluss |

---

## 8. Integrationen

### 8.1 Mitgliedschaften

- Support-Priorität je Plan (siehe `MITGLIEDSCHAFTEN.md`)
- Meister: dedizierter Support-Kanal (eigene Kategorie oder Tag)

### 8.2 Kurse

- Kurs-spezifische Forum-Kategorien
- Support-Kategorie `course_content` verlinkt Kurs

### 8.3 Newsletter

| Trigger | Aktion |
|---------|--------|
| Neues Mitglied | Willkommens-Serie |
| Inaktiv 30 Tage | Re-Engagement |
| Forum-Meilenstein | Badge + Glückwunsch |

### 8.4 Werkstatt

- Forum-Kategorie für Tool-Fragen
- Support-Kategorie `tools` für technische Probleme

---

## 9. Migration (bbPress + Support-Plugin)

### 9.1 Forum (bbPress)

| bbPress | Alles-Wurst 2.0 |
|---------|-----------------|
| forum | ForumCategory |
| topic | ForumTopic |
| reply | ForumReply |
| user | User (bestehend) |

**Besonderheiten:**
- HTML bereinigen
- Anhänge migrieren
- View-Counts übernehmen

### 9.2 Support (alles-wurst-support-tickets)

| Alt | Neu |
|-----|-----|
| awst_ticket | Ticket |
| awst_message | TicketMessage |
| awst_category | Ticket.category (Enum) |
| aw_support_agent | User.role = support_agent |

---

## 10. Datenschutz

| Aspekt | Maßnahme |
|--------|----------|
| Profil-Sichtbarkeit | Nutzer-konfigurierbar |
| Direktnachrichten | Nicht öffentlich, nicht indexiert |
| Forum-Beiträge | Löschung bei Kontolöschung (anonymisiert) |
| Support-Tickets | 3 Jahre Aufbewahrung, dann anonymisiert |
| Meldungen | 1 Jahr Aufbewahrung |

---

*Community und Support werden in Roadmap Phase 3 implementiert.*
