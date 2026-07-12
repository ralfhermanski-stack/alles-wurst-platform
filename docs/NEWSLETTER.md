# Newsletter – Alles-Wurst 2.0

**Version:** 1.0  
**Stand:** Juli 2026  
**Bezug:** `DATENMODELL.md`, `MITGLIEDSCHAFTEN.md`, `KURSSYSTEM.md`  

---

## 1. Übersicht

Das Newsletter-System ermöglicht professionelle E-Mail-Kommunikation mit Abonnenten, Mitgliedern und Kursteilnehmern. Es unterstützt Double-Opt-In, Segmentierung, Kampagnen, Automationen und Tracking – vollständig integriert in die Plattform.

### 1.1 Ziele

- Rechtssichere E-Mail-Kommunikation (DSGVO, TTDSG)
- Personalisierte Inhalte durch Segmentierung
- Automatisierte Journeys (Onboarding, Re-Engagement)
- Messbare Kampagnen (Öffnungen, Klicks)
- Integration mit Mitgliedschaften und Kursen

### 1.2 Abgrenzung

| Typ | System | Beispiele |
|-----|--------|-----------|
| Transaktional | Benachrichtigungssystem | Registrierung, Passwort, Zahlung |
| Newsletter | Dieses Modul | Kampagnen, Automationen, Marketing |

---

## 2. Abonnenten

### 2.1 Anmeldung (Double-Opt-In)

**Workflow:**
```
Anmeldeformular → E-Mail mit Bestätigungslink → Klick → Abonnent aktiv
```

1. Nutzer gibt E-Mail ein (optional: Interessen, Frequenz)
2. System erstellt `Subscriber` (Status: `pending`)
3. Bestätigungs-E-Mail mit Token (24 h gültig)
4. Nutzer klickt Link: `/newsletter/bestaetigen/{token}`
5. Status → `active`, `confirmed_at` gesetzt
6. Consent-Log-Eintrag erstellt
7. Willkommens-E-Mail (optional)

**Anmeldeformulare:**
- `/newsletter/anmelden` (eigene Seite)
- Eingebettet auf Startseite
- Shortcode/Widget für andere Seiten
- Popup (konfigurierbar, mit Consent)

### 2.2 Abonnenten-Attribute

| Attribut | Beschreibung |
|----------|--------------|
| email | E-Mail-Adresse (eindeutig) |
| user_id | Verknüpfung mit Plattform-Account (optional) |
| status | pending, active, unsubscribed, bounced, complained |
| interests | Gewählte Interessen (Array) |
| frequency | weekly, biweekly, monthly |
| membership_level | Sync aus Mitgliedschaft |
| metadata | Sync-Daten (Kurse, Verhalten) |
| consent_log | Nachweise (Timestamp, IP, Quelle) |

### 2.3 Interessen (Standard)

| Interesse | Slug |
|-----------|------|
| Wurst selber machen | `wurst` |
| Fleisch & Grillen | `grillen` |
| Marinaden | `marinaden` |
| Räuchern | `raeuchern` |
| Kurse & Lernen | `kurse` |
| Werkstatt & Produkte | `werkstatt` |
| Rezepte & Tipps | `rezepte` |
| Angebote & Aktionen | `angebote` |

### 2.4 Frequenz

| Option | Beschreibung |
|--------|--------------|
| `weekly` | Wöchentlicher Digest |
| `biweekly` | Alle 2 Wochen |
| `monthly` | Monatlicher Digest |

Nutzer kann Frequenz in Einstellungen ändern.

### 2.5 Abmeldung

**Ein-Klick-Abmeldung:**
- Link in jeder E-Mail: `/newsletter/abmelden/{token}`
- Status → `unsubscribed`
- Bestätigungsseite
- Kein Login erforderlich

**Einstellungszentrum:**
- `/newsletter/einstellungen/{token}`
- Interessen ändern
- Frequenz ändern
- Vollständig abmelden

### 2.6 Bounce und Complaint Handling

| Status | Auslöser | Aktion |
|--------|----------|--------|
| `bounced` | Hard Bounce (Adresse ungültig) | Kein weiterer Versand |
| `complained` | Spam-Beschwerde | Kein weiterer Versand, Admin-Benachrichtigung |

Webhook von E-Mail-Provider verarbeiten.

---

## 3. Segmentierung

### 3.1 Konzept

Segmente sind dynamische Zielgruppen, definiert durch Regeln. Abonnenten werden automatisch zugeordnet.

### 3.2 Regel-Typen

| Typ | Operatoren | Beispiel |
|-----|------------|----------|
| Mitgliedschaft | ist, ist nicht | Mitgliedschaft = Premium |
| Kurs-Status | gekauft, begonnen, abgeschlossen | Kurs „Bratwurst" abgeschlossen |
| Interesse | enthält | Interesse = Räuchern |
| Registrierung | vor, nach, zwischen | Registriert in letzten 30 Tagen |
| Verhalten | hat geöffnet, hat geklickt | Letzte Kampagne geöffnet |
| Status | ist | Status = active |

### 3.3 Regel-Kombination

```
(Mitgliedschaft = Premium ODER Mitgliedschaft = Meister)
UND
(Interesse enthält "Räuchern")
UND
(Status = active)
```

### 3.4 Standard-Segmente

| Segment | Regeln |
|---------|--------|
| Alle aktiven | Status = active |
| Basis-Mitglieder | Mitgliedschaft = basis |
| Premium-Mitglieder | Mitgliedschaft = premium |
| Meister-Mitglieder | Mitgliedschaft = meister |
| Nicht-Mitglieder | Kein user_id ODER Mitgliedschaft = none |
| Kurs-Absolventen | Mind. 1 Kurs abgeschlossen |
| Inaktive (30d) | Letzte Öffnung > 30 Tage |
| Neue Abonnenten | Registriert < 7 Tage |

### 3.5 Segment-Berechnung

- Automatisch: Täglich um 03:00 Uhr
- Manuell: Button „Neu berechnen" im Admin
- Bei Kampagne: Live-Berechnung vor Versand

---

## 4. Kampagnen

### 4.1 Kampagnen-Lebenszyklus

```
Entwurf → Geplant → Wird gesendet → Gesendet
                  ↘ Abgebrochen
```

### 4.2 Kampagnen-Attribute

| Attribut | Beschreibung |
|----------|--------------|
| name | Interner Name |
| subject | E-Mail-Betreff |
| preview_text | Preheader (Vorschau in Mail-Client) |
| template_id | Basis-Vorlage |
| content_blocks | Block-basierter Inhalt |
| segment_ids | Zielsegmente |
| status | draft, scheduled, sending, sent, cancelled |
| scheduled_at | Geplanter Versand |
| sent_at | Tatsächlicher Versand |

### 4.3 Content-Blöcke

| Block-Typ | Beschreibung |
|-----------|--------------|
| `header` | Logo, Titel |
| `text` | Rich Text (HTML) |
| `image` | Bild mit Link |
| `button` | CTA-Button |
| `divider` | Trennlinie |
| `course` | Kurs-Karte (dynamisch) |
| `product` | Werkstatt-Produkt (dynamisch) |
| `recipe` | Rezept-Tipp (dynamisch) |
| `footer` | Abmelde-Link, Impressum |

### 4.4 Dynamische Blöcke

**Kurs-Block:**
- Kurs auswählen
- Automatisch: Thumbnail, Titel, Beschreibung, Link
- Personalisierung: „Empfohlen für dich"

**Produkt-Block:**
- Produkt aus Werkstatt auswählen
- Automatisch: Bild, Name, Preis, Affiliate-Link

**Rezept-Block:**
- Rezept aus Datenbank oder manuell
- Automatisch: Name, Kategorie, Link

### 4.5 Kampagnen-Editor

- Drag-and-Drop Block-Editor
- Vorschau (Desktop/Mobile)
- Personalisierung: `{{first_name}}`, `{{membership}}`
- Testversand an Admin-E-Mail
- Segment-Vorschau (Anzahl Empfänger)

### 4.6 Versand

**Sofortversand:**
1. Validierung (Betreff, Inhalt, Segment)
2. Bestätigungsdialog
3. Queue-Einträge erstellen
4. Batch-Versand (z. B. 100/Minute)
5. Status → `sending` → `sent`

**Geplanter Versand:**
1. `scheduled_at` setzen
2. Cron-Job prüft fällige Kampagnen
3. Versand wie oben

### 4.7 Tracking

| Metrik | Beschreibung |
|--------|--------------|
| Gesendet | Anzahl erfolgreich zugestellt |
| Zugestellt | Ohne Bounce |
| Geöffnet | Tracking-Pixel (mit Consent) |
| Geklickt | Link-Tracking (mit Consent) |
| Bounces | Hard/Soft Bounce |
| Abmeldungen | Nach Kampagne |
| Beschwerden | Spam-Meldungen |

**Tracking-URLs:**
- Öffnung: `/newsletter/track/open/{campaign_id}/{subscriber_id}`
- Klick: `/newsletter/track/click/{campaign_id}/{subscriber_id}/{link_id}`

---

## 5. Automationen

### 5.1 Konzept

Automationen sind regelbasierte E-Mail-Sequenzen, ausgelöst durch Ereignisse.

### 5.2 Trigger

| Trigger | Beschreibung |
|---------|--------------|
| `subscriber_confirmed` | DOI bestätigt |
| `user_registered` | Plattform-Registrierung |
| `membership_started` | Mitgliedschaft begonnen |
| `membership_upgraded` | Upgrade |
| `membership_cancelled` | Kündigung |
| `course_purchased` | Kurs gekauft |
| `course_started` | Erste Lektion begonnen |
| `course_completed` | Kurs abgeschlossen |
| `inactive_7d` | 7 Tage inaktiv (Kurs) |
| `inactive_30d` | 30 Tage inaktiv (Plattform) |
| `birthday` | Geburtstag (wenn hinterlegt) |

### 5.3 Bedingungen

- Mitgliedschaft ist X
- Kurs ist Y
- Interesse enthält Z
- Zeitverzögerung (z. B. 3 Tage nach Trigger)

### 5.4 Aktionen

| Aktion | Beschreibung |
|--------|--------------|
| `send_email` | E-Mail aus Vorlage senden |
| `add_tag` | Tag setzen |
| `remove_tag` | Tag entfernen |
| `add_to_segment` | Zu Segment hinzufügen |
| `wait` | Warten (X Tage/Stunden) |

### 5.5 Standard-Automationen

| Name | Trigger | Aktionen |
|------|---------|----------|
| Willkommen Newsletter | subscriber_confirmed | Willkommens-E-Mail |
| Onboarding Tag 1 | user_registered | Tipps für Neueinsteiger |
| Onboarding Tag 3 | user_registered + 3d | Werkstatt-Tools vorstellen |
| Onboarding Tag 7 | user_registered + 7d | Mitgliedschaft anbieten |
| Kurs-Willkommen | course_purchased | Kurs-Einführung |
| Kurs-Erinnerung | inactive_7d (Kurs) | „Weiterlernen"-Erinnerung |
| Kurs-Abschluss | course_completed | Glückwunsch + Zertifikat |
| Re-Engagement | inactive_30d | „Wir vermissen dich" |
| Upgrade-Angebot | membership_started (Basis) + 30d | Premium-Vorteile |

### 5.6 Automation-Editor

- Visueller Flow-Editor (optional, Phase 2)
- Oder: Formular-basiert (Trigger, Bedingungen, Aktionen)
- Aktivieren/Deaktivieren
- Ausführungs-Log

---

## 6. Vorlagen

### 6.1 E-Mail-Vorlagen

| Vorlage | Verwendung |
|---------|------------|
| Newsletter-Standard | Kampagnen-Basis |
| Willkommen | DOI-Bestätigung, Onboarding |
| Transaktional | (im Benachrichtigungssystem) |
| Kurs | Kurs-bezogene E-Mails |
| Minimal | Nur Text |

### 6.2 Vorlagen-Attribute

- Name, Beschreibung
- HTML-Inhalt mit Platzhaltern
- Branding: Logo, Farben, Footer
- Vorschau

### 6.3 Branding

| Element | Wert |
|---------|------|
| Logo | Alles-Wurst Wappen |
| Primärfarbe | #D4AF37 (Gold) |
| Hintergrund | #1A2327 (Dunkel) |
| Text | #FAF7F0 (Creme) |
| Schrift | Montserrat |
| Footer | Abmelde-Link, Impressum, Datenschutz |

---

## 7. E-Mail-Provider

### 7.1 Unterstützte Provider

| Provider | Stärken |
|----------|---------|
| Brevo (Sendinblue) | EU, günstig, Automationen |
| SendGrid | Skalierbar, API |
| Mailgun | Entwicklerfreundlich |
| Amazon SES | Günstig, skalierbar |
| wp_mail / SMTP | Fallback (nicht empfohlen für Bulk) |

### 7.2 Konfiguration

| Einstellung | Beschreibung |
|-------------|--------------|
| Provider | Auswahl |
| API-Key | Authentifizierung |
| Absender-Name | Alles-Wurst |
| Absender-E-Mail | newsletter@alles-wurst.de |
| Reply-To | support@alles-wurst.de |
| Bounce-Webhook | URL für Bounce-Events |
| Complaint-Webhook | URL für Spam-Beschwerden |

### 7.3 Zustellbarkeit

- SPF, DKIM, DMARC konfigurieren
- Dedicated IP (ab 10.000 Abonnenten)
- Warm-up bei neuem Provider
- Bounce-Rate < 2 % überwachen

---

## 8. Synchronisation

### 8.1 Mitgliedschaften

| Event | Sync-Aktion |
|-------|-------------|
| Abo gestartet | `membership_level` setzen, Tag hinzufügen |
| Upgrade | Level aktualisieren |
| Kündigung | Tag `churned` setzen |
| Ablauf | Level → `none` |

Sync: Täglich + bei Event (Webhook)

### 8.2 Kurse

| Event | Sync-Aktion |
|-------|-------------|
| Kurs gekauft | `metadata.courses.purchased` |
| Kurs begonnen | `metadata.courses.started` |
| Kurs abgeschlossen | `metadata.courses.completed` |

### 8.3 Plattform-User

- Bei Registrierung: Subscriber mit `user_id` verknüpfen (wenn E-Mail matcht)
- Interessen aus UserPreference übernehmen

---

## 9. Admin-Bereich

### 9.1 Abonnenten (`/admin/newsletter/abonnenten`)

- Liste mit Status, Interessen, Mitgliedschaft
- Filter, Suche
- Einzeln bearbeiten, löschen
- Import (CSV mit Consent-Nachweis)
- Export (DSGVO-konform)

### 9.2 Segmente (`/admin/newsletter/segmente`)

- Segment-Builder
- Vorschau (Anzahl)
- Manuell neu berechnen

### 9.3 Kampagnen (`/admin/newsletter/kampagnen`)

- Liste (Entwurf, geplant, gesendet)
- Editor
- Statistiken nach Versand

### 9.4 Automationen (`/admin/newsletter/automationen`)

- Liste aktiver Automationen
- Erstellen/Bearbeiten
- Ausführungs-Log

### 9.5 Vorlagen (`/admin/newsletter/vorlagen`)

- CRUD Vorlagen
- Vorschau

### 9.6 Einstellungen

- Provider-Konfiguration
- DOI-Einstellungen
- Standard-Interessen
- Tracking (aktivieren/deaktivieren)

---

## 10. Rechtliches

### 10.1 DSGVO

| Anforderung | Umsetzung |
|-------------|-----------|
| Einwilligung | DOI mit Consent-Log |
| Widerruf | Ein-Klick-Abmeldung |
| Auskunft | Export in DSGVO-Export |
| Löschung | Bei Kontolöschung |
| Datenminimierung | Nur notwendige Felder |

### 10.2 TTDSG / ePrivacy

- Tracking (Öffnungen, Klicks) nur mit Consent
- Consent-Banner vor Tracking-Pixel
- Alternative: Engagement-basiertes Tracking ohne Pixel

### 10.3 Impressum und Pflichtangaben

Jede E-Mail enthält:
- Absender (Name, Adresse)
- Abmelde-Link
- Impressum-Link
- Datenschutz-Link

---

## 11. Migration (Newsletter-Suite Plugin)

| Alt (AWNS) | Neu |
|------------|-----|
| awns_subscriber | Subscriber |
| awns_campaign | Campaign |
| awns_segment | Segment |
| awns_automation | Automation |
| awns_template | EmailTemplate |
| consent_log | consent_log (JSON) |

**Besonderheiten:**
- Nur `active` Abonnenten migrieren
- Consent-Log vollständig übernehmen
- Bounced/Complained ausschließen

---

## 12. Reporting

| Metrik | Beschreibung |
|--------|--------------|
| Abonnenten gesamt | Aktive Abonnenten |
| Wachstum | Neue Abonnenten pro Zeitraum |
| Abmelderate | Unsubscribes / Gesendet |
| Ø Öffnungsrate | Opens / Zugestellt |
| Ø Klickrate | Clicks / Zugestellt |
| Top-Kampagnen | Nach Engagement |
| Automation-Performance | Pro Automation |

---

*Das Newsletter-System wird in Roadmap Phase 4 implementiert.*
