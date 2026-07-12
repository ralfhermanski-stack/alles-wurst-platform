# Rollenmodell – Alles-Wurst 2.0

**Version:** 1.0  
**Stand:** Juli 2026  
**Bezug:** `LASTENHEFT.md`, `PFLICHTENHEFT.md`  

---

## 1. Grundprinzipien

Das Rollenmodell basiert auf **RBAC** (Role-Based Access Control) mit zwei Ebenen:

1. **Systemrollen** – feste Rollen mit definierten Berechtigungssätzen
2. **Mitgliedschaftslevel** – kommerzielle Stufen, die Feature-Zugang steuern

Ein Benutzer hat **genau eine Systemrolle** und **optional ein Mitgliedschaftslevel**. Feature-Zugang ergibt sich aus der Kombination beider Ebenen sowie aus individuellen Zugängen (z. B. Einzelkurskauf).

```
Effektiver Zugang = Systemrolle ∩ Mitgliedschaftslevel ∩ Ressourcenbesitz
```

---

## 2. Systemrollen

### 2.1 Übersicht

| Rolle | Slug | Beschreibung |
|-------|------|--------------|
| Gast | `guest` | Nicht angemeldeter Besucher |
| Mitglied | `member` | Registrierter Standardnutzer |
| Support-Agent | `support_agent` | Bearbeitet Support-Tickets |
| Kursautor | `course_author` | Erstellt und pflegt Kurse |
| Newsletter-Redakteur | `newsletter_editor` | Verwaltet Newsletter |
| Moderator | `moderator` | Moderiert Community und Forum |
| Redakteur | `editor` | Verwaltet Inhalte (Werkstatt, Seiten) |
| Administrator | `admin` | Vollzugriff auf alle Module |
| Super-Admin | `super_admin` | Systemeinstellungen, Rollen, Audit |

### 2.2 Rollenhierarchie

```
super_admin
    └── admin
            ├── editor
            ├── moderator
            ├── newsletter_editor
            ├── course_author
            └── support_agent
                    └── member
                            └── guest
```

Höhere Rollen erben Berechtigungen niedrigerer Rollen nicht automatisch – Berechtigungen werden explizit zugewiesen. Die Hierarchie dient der organisatorischen Einordnung.

---

## 3. Mitgliedschaftslevel

| Level | Slug | Preis (monatlich) | Zielgruppe |
|-------|------|-------------------|------------|
| Keine | `none` | – | Gast / registriert ohne Abo |
| Basis | `basis` | 9,90 € | Einsteiger, Community, Einzelkurse |
| Premium | `premium` | 19,90 € | Aktive Hobbywurstler, volle Tools |
| Meister | `meister` | 39,90 € | Ambitionierte, Meisterclub, Analyse |

Jährliche Abrechnung mit Rabatt (z. B. 2 Monate gratis) wird unterstützt.

---

## 4. Berechtigungsmatrix

Legende: ✓ = erlaubt, ○ = eingeschränkt, – = nicht erlaubt

### 4.1 Plattform allgemein

| Aktion | Gast | Mitglied | Support | Kursautor | Moderator | Editor | Admin |
|--------|------|----------|---------|-----------|-----------|--------|-------|
| Startseite / Marketing | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Registrierung / Login | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Eigenes Profil bearbeiten | – | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Fremdes Profil ansehen | ○ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Mitglieder-Dashboard | – | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| DSGVO-Export / Löschung | – | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

### 4.2 Akademie

| Aktion | Gast | Mitglied | Kursautor | Admin |
|--------|------|----------|-----------|-------|
| Kurskatalog ansehen | ✓ | ✓ | ✓ | ✓ |
| Kursdetails (Vorschau) | ✓ | ✓ | ✓ | ✓ |
| Lektionen absolvieren | – | ○¹ | ✓² | ✓ |
| Quiz absolvieren | – | ○¹ | ✓² | ✓ |
| Zertifikat erhalten | – | ○¹ | ✓² | ✓ |
| Kurs erstellen/bearbeiten | – | – | ✓ (eigene) | ✓ (alle) |
| Kurs veröffentlichen | – | – | ○³ | ✓ |
| Lernpfade verwalten | – | – | – | ✓ |

¹ Nur mit Kurszugang (Mitgliedschaft oder Kauf)  
² Eigene Kurse zur Vorschau  
³ Entwurf → Review → Veröffentlichung durch Admin

### 4.3 Werkstatt

| Tool | Gast | Basis | Premium | Meister |
|------|------|-------|---------|---------|
| Salzrechner | ✓ | ✓ | ✓ | ✓ |
| Affiliate-Katalog | ✓ | ✓ | ✓ | ✓ |
| Lakerechner | – | – | ✓ | ✓ |
| Rezeptgenerator (eigene) | – | ○⁴ | ✓ | ✓ |
| Marinaden-Generator | – | – | ✓ | ✓ |
| Rezeptdatenbank (lesen) | – | – | ✓ | ✓ |
| Rezeptdatenbank (veröffentlichen) | – | – | – | ✓ |
| Rezeptanalyse | – | – | – | ✓ |

⁴ Basis: max. 3 gespeicherte Rezepte, kein PDF

### 4.4 Community

| Aktion | Gast | Mitglied (Basis+) | Moderator | Admin |
|--------|------|-------------------|-----------|-------|
| Forum lesen | ○⁵ | ✓ | ✓ | ✓ |
| Forum beitragen | – | ✓ | ✓ | ✓ |
| Thema erstellen | – | ✓ | ✓ | ✓ |
| Direktnachrichten senden | – | ✓ | ✓ | ✓ |
| Beiträge melden | – | ✓ | ✓ | ✓ |
| Beiträge moderieren | – | – | ✓ | ✓ |
| Nutzer sperren (Forum) | – | – | ✓ | ✓ |
| Ankündigungen (pinned) | – | – | ✓ | ✓ |

⁵ Öffentliche Kategorien lesbar, Mitglieder-Kategorien nur mit Abo

### 4.5 Meisterclub

| Aktion | Meister | Admin |
|--------|---------|-------|
| Meisterclub-Bereich betreten | ✓ | ✓ |
| Exklusive Inhalte | ✓ | ✓ |
| Rezeptanalyse / Rankings | ✓ | ✓ |
| Mentoring-Anfragen stellen | ✓ | ✓ |
| Live-Sessions (Teilnahme) | ✓ | ✓ |

### 4.6 Support

| Aktion | Mitglied | Support-Agent | Admin |
|--------|----------|---------------|-------|
| Ticket erstellen | ✓ | ✓ | ✓ |
| Eigene Tickets sehen | ✓ | ✓ | ✓ |
| Alle Tickets sehen | – | ✓ | ✓ |
| Ticket beantworten | ○⁶ | ✓ | ✓ |
| Ticket zuweisen | – | ✓ | ✓ |
| Ticket schließen | – | ✓ | ✓ |
| Support-Einstellungen | – | – | ✓ |

⁶ Nur eigene, wenn nicht geschlossen

### 4.7 Newsletter

| Aktion | Gast | Mitglied | Newsletter-Editor | Admin |
|--------|------|----------|-------------------|-------|
| Newsletter abonnieren | ✓ | ✓ | ✓ | ✓ |
| Präferenzen ändern | – | ✓ | ✓ | ✓ |
| Abmelden | – | ✓ | ✓ | ✓ |
| Kampagnen erstellen | – | – | ✓ | ✓ |
| Segmente verwalten | – | – | ✓ | ✓ |
| Automationen verwalten | – | – | ✓ | ✓ |
| Abonnenten exportieren | – | – | ○⁷ | ✓ |

⁷ Nur anonymisiert / mit Consent

### 4.8 Zahlung und Rechnungen

| Aktion | Mitglied | Admin |
|--------|----------|-------|
| Checkout (Mitgliedschaft/Kurs) | ✓ | ✓ |
| Eigene Rechnungen einsehen | ✓ | ✓ |
| Alle Rechnungen einsehen | – | ✓ |
| Rechnung manuell erstellen | – | ✓ |
| Rechnung stornieren | – | ✓ |
| Zahlungsanbieter-Einstellungen | – | ✓ |

### 4.9 Adminbereich

| Bereich | Editor | Moderator | Newsletter | Kursautor | Support | Admin | Super-Admin |
|---------|--------|-----------|------------|-----------|---------|-------|-------------|
| Dashboard | – | – | – | – | ○⁸ | ✓ | ✓ |
| Benutzerverwaltung | – | – | – | – | – | ✓ | ✓ |
| Kurse | – | – | – | ✓ | – | ✓ | ✓ |
| Mitgliedschaften | – | – | – | – | – | ✓ | ✓ |
| Community/Forum | – | ✓ | – | – | – | ✓ | ✓ |
| Support | – | – | – | – | ✓ | ✓ | ✓ |
| Newsletter | – | – | ✓ | – | – | ✓ | ✓ |
| Werkstatt/Produkte | ✓ | – | – | – | – | ✓ | ✓ |
| Zahlungen/Rechnungen | – | – | – | – | – | ✓ | ✓ |
| Systemeinstellungen | – | – | – | – | – | ○⁹ | ✓ |
| Audit-Log | – | – | – | – | – | ✓ | ✓ |
| Rollenverwaltung | – | – | – | – | – | – | ✓ |

⁸ Nur Support-KPIs  
⁹ Eingeschränkt (keine Secrets)

---

## 5. Berechtigungs-Slugs (technische Referenz)

Für die spätere Implementierung werden Berechtigungen als Slugs definiert:

### 5.1 Benutzer
- `users.view`, `users.edit`, `users.delete`, `users.impersonate`

### 5.2 Akademie
- `courses.view`, `courses.enroll`, `courses.create`, `courses.edit`, `courses.publish`, `courses.delete`
- `certificates.view`, `certificates.issue`, `certificates.revoke`

### 5.3 Mitgliedschaft
- `memberships.subscribe`, `memberships.manage`

### 5.4 Community
- `forum.read`, `forum.post`, `forum.moderate`
- `messages.send`, `messages.read`
- `profiles.view`, `profiles.edit`

### 5.5 Werkstatt
- `tools.salz`, `tools.lake`, `tools.recipe`, `tools.marinade`, `tools.analysis`
- `recipes.database.view`, `recipes.database.publish`
- `products.view`, `products.manage`

### 5.6 Support
- `tickets.create`, `tickets.view_own`, `tickets.view_all`, `tickets.reply`, `tickets.assign`, `tickets.close`

### 5.7 Newsletter
- `newsletter.subscribe`, `newsletter.campaigns`, `newsletter.segments`, `newsletter.automations`

### 5.8 Zahlung
- `billing.checkout`, `billing.invoices.view_own`, `billing.invoices.manage`

### 5.9 Admin
- `admin.access`, `admin.settings`, `admin.audit`, `admin.roles`

---

## 6. Sonderfälle und Regeln

### 6.1 Mehrfach-Zugang

Ein Nutzer kann gleichzeitig haben:
- Premium-Mitgliedschaft
- Einzelkurskauf (Kurs außerhalb des Premium-Katalogs)
- Meisterclub-Zugang (über Meister-Level)

Der effektive Zugang ist die **Vereinigung** aller Quellen.

### 6.2 Abgelaufene Mitgliedschaft

- Grace Period: 7 Tage nach fehlgeschlagener Zahlung (Lesezugriff, keine neuen Aktionen)
- Nach Grace Period: Downgrade auf `none`, gespeicherte Rezepte bleiben (read-only)
- Kursfortschritt bleibt erhalten, Zugang zu kostenpflichtigen Lektionen gesperrt
- Zertifikate bleiben gültig und abrufbar

### 6.3 Gesperrte Nutzer

Status `suspended`:
- Login weiterhin möglich (um Support zu kontaktieren)
- Keine Community-Beiträge, keine DMs
- Lesezugriff auf gekaufte Inhalte bleibt (konfigurierbar)

Status `banned`:
- Login gesperrt
- Profil nicht öffentlich sichtbar

### 6.4 Minderjährige

- Registrierung ab 16 Jahren (mit Einwilligung)
- Keine Zahlungsabwicklung unter 18 ohne Erziehungsberechtigten

---

## 7. Meisterclub als Sub-Rolle

Der Meisterclub ist **kein separates System**, sondern ein Feature-Set, das durch das Mitgliedschaftslevel `meister` aktiviert wird. Zusätzlich können Admins einzelnen Nutzern temporären Meisterclub-Zugang gewähren (z. B. für Testimonials, Partnerschaften):

| Attribut | Beschreibung |
|----------|--------------|
| `meisterclub_override` | Boolean, setzbar durch Admin |
| `meisterclub_override_expires` | Ablaufdatum (optional) |
| `meisterclub_override_reason` | Interne Notiz |

---

## 8. Audit und Compliance

Rollenänderungen werden protokolliert:
- Wer hat welcher Nutzer welche Rolle erhalten/entzogen
- Zeitstempel und Begründung (Pflichtfeld bei manueller Änderung)
- Mitgliedschaftsänderungen über Zahlungssystem (automatisch) oder Admin (manuell)

---

*Änderungen am Rollenmodell erfordern Review durch Projektleitung und Aktualisierung der Berechtigungsmatrix.*
