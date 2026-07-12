# Mitgliedschaften – Alles-Wurst 2.0

**Version:** 1.0  
**Stand:** Juli 2026  
**Bezug:** `ROLLENMODELL.md`, `ZAHLUNGSSYSTEM.md`, `KURSSYSTEM.md`  

---

## 1. Übersicht

Das Mitgliedschaftssystem steuert den kommerziellen Zugang zur Plattform. Drei Stufen (Basis, Premium, Meister) bieten gestaffelte Features und Inhalte. Die Meister-Stufe beinhaltet den **Meisterclub** als Premium-Expertenbereich.

### 1.1 Geschäftsmodell

| Stufe | Monatlich | Jährlich | Ersparnis |
|-------|-----------|----------|-----------|
| Basis | 9,90 € | 99,00 € | ~17 % |
| Premium | 19,90 € | 199,00 € | ~17 % |
| Meister | 39,90 € | 399,00 € | ~17 % |

Alle Preise inkl. MwSt. Jährliche Abrechnung = 10 Monate (2 Monate gratis).

---

## 2. Mitgliedschaftsstufen

### 2.1 Basis (9,90 €/Monat)

**Zielgruppe:** Einsteiger, Gelegenheits-Wurstler, Community-Interessierte

| Feature | Zugang |
|---------|--------|
| Community-Forum | ✓ |
| Direktnachrichten | ✓ |
| Mitgliederprofil | ✓ |
| Salzrechner | ✓ (auch öffentlich) |
| Affiliate-Werkstatt | ✓ |
| Rezeptgenerator | Eingeschränkt (max. 3 Rezepte, kein PDF) |
| Kurse | Kostenlose + Basis-Kurse |
| Einzelkurskauf | ✓ (mit Rabatt 10 %) |
| Lakerechner | – |
| Marinaden-Generator | – |
| Rezeptdatenbank | – |
| Rezeptanalyse | – |
| Meisterclub | – |
| Zertifikate | ✓ (für absolvierte Kurse) |
| Support | Standard |

### 2.2 Premium (19,90 €/Monat)

**Zielgruppe:** Aktive Hobbywurstler, ambitionierte Lernende

| Feature | Zugang |
|---------|--------|
| Alle Basis-Features | ✓ |
| Lakerechner mit PDF | ✓ |
| Rezeptgenerator (voll) | ✓ (unbegrenzt, PDF) |
| Marinaden-Generator | ✓ |
| Rezeptdatenbank (lesen) | ✓ |
| Kurse | + Premium-Kurse |
| Einzelkurskauf | ✓ (mit Rabatt 20 %) |
| Rezeptanalyse | – |
| Meisterclub | – |
| Support | Priorisiert |

### 2.3 Meister (39,90 €/Monat)

**Zielgruppe:** Ambitionierte, Profis, Community-Multiplikatoren

| Feature | Zugang |
|---------|--------|
| Alle Premium-Features | ✓ |
| Meisterclub | ✓ |
| Rezeptanalyse (Meisterwerkstatt) | ✓ |
| Rezeptdatenbank (veröffentlichen) | ✓ |
| Kurse | + alle Kurse, Frühzugang (14 Tage) |
| Exklusive Meisterclub-Inhalte | ✓ |
| Live-Sessions | ✓ |
| Mentoring-Anfragen | ✓ |
| Rezept-Rankings | ✓ |
| Werkstatt-Rabatte | ✓ (Affiliate-Coupons, Phase 2) |
| Support | Priorisiert + dedizierter Kanal |

---

## 3. Meisterclub

### 3.1 Konzept

Der Meisterclub ist kein separates Produkt, sondern das **Premium-Feature-Set** der Meister-Mitgliedschaft. Er bietet exklusiven Zugang zu Expertenwissen, Community und Analyse-Tools.

### 3.2 Meisterclub-Bereiche

| Bereich | Beschreibung |
|---------|--------------|
| Übersicht | Willkommen, aktuelle Highlights, Termine |
| Exklusive Inhalte | Artikel, Videos, Downloads nur für Meister |
| Live-Sessions | Monatliche Live-Q&A, Aufzeichnungen |
| Mentoring | Asynchrone Experten-Anfragen (1×/Monat) |
| Rankings | Rezept-Rankings basierend auf Analyse-Scores |
| Forum | Exklusive Meisterclub-Kategorie |

### 3.3 Mentoring-System

**Workflow:**
1. Meister-Mitglied stellt Anfrage (Thema, Beschreibung, optional Rezept-Anhang)
2. Anfrage erscheint in Admin-Queue
3. Experte/Admin antwortet (asynchron, innerhalb 5 Werktagen)
4. Antwort im Meisterclub-Bereich des Nutzers
5. Limit: 1 Anfrage pro Monat (konfigurierbar)

### 3.4 Live-Sessions

- Monatliche Termine (Ankündigung 2 Wochen vorher)
- Thema: Q&A, neue Techniken, Saisonales
- Plattform: Zoom/Teams (externer Link) oder integriert (Phase 2)
- Aufzeichnungen im Meisterclub-Archiv

### 3.5 Rezept-Rankings

- Basierend auf Analyse-Scores (Meisterwerkstatt)
- Opt-in: Nutzer können Rezept für Ranking freigeben
- Kategorien: Bratwurst, Rohwurst, Räucherwurst, etc.
- Anonymisierung optional (nur Rezeptname + Score)

---

## 4. Abonnement-Lebenszyklus

### 4.1 Status-Übergänge

```
                    ┌─────────────┐
    Registrierung → │   active    │ ← Erfolgreiche Zahlung
                    └──────┬──────┘
                           │
              Zahlung fehlgeschlagen
                           ↓
                    ┌─────────────┐
                    │  past_due   │ (Grace Period: 7 Tage)
                    └──────┬──────┘
                           │
              Grace Period abgelaufen
                           ↓
                    ┌─────────────┐
                    │   expired   │
                    └─────────────┘

    Kündigung (zum Periodenende) → cancelled → expired
```

### 4.2 Status-Beschreibungen

| Status | Beschreibung | Zugang |
|--------|--------------|--------|
| `active` | Abo aktiv, Zahlung aktuell | Voll |
| `past_due` | Zahlung fehlgeschlagen, Grace Period | Lesezugriff, keine neuen Aktionen |
| `cancelled` | Gekündigt, läuft bis Periodenende | Voll bis Ende |
| `expired` | Abgelaufen | Eingeschränkt (siehe 4.3) |

### 4.3 Verhalten nach Ablauf

| Ressource | Verhalten |
|-----------|-----------|
| Gespeicherte Rezepte | Bleiben, read-only |
| Kursfortschritt | Bleibt erhalten |
| Kurszugang (kostenpflichtig) | Gesperrt |
| Zertifikate | Bleiben abrufbar |
| Forum-Beiträge | Bleiben sichtbar, kein Neuposting |
| Direktnachrichten | Lesen, kein Senden |
| Rechnungen | Bleiben abrufbar |

---

## 5. Checkout und Zahlung

### 5.1 Checkout-Flow

```
Mitgliedschaftsseite → Plan wählen → Login/Registrierung → Checkout → Zahlung → Bestätigung
```

### 5.2 Checkout-Seite `/checkout/mitgliedschaft/{plan}`

**Inhalte:**
- Gewählter Plan mit Features
- Abrechnungszyklus (monatlich/jährlich)
- Preis mit MwSt.-Ausweis
- Zahlungsmethode wählen
- AGB/Widerruf-Checkbox
- CTA: „Jetzt bezahlen“

### 5.3 Nach erfolgreicher Zahlung

1. `Membership` erstellt/aktualisiert (Status: `active`)
2. `Order` und `Invoice` erstellt
3. Willkommens-E-Mail mit Zugangsdetails
4. Newsletter-Segment aktualisiert
5. Redirect zu `/checkout/erfolg` mit Onboarding-Hinweisen

---

## 6. Upgrade und Downgrade

### 6.1 Upgrade (z. B. Basis → Premium)

- Sofortiger Zugang zu neuen Features
- Anteilige Verrechnung (Proration):
  - Gutschrift für ungenutzte Basis-Tage
  - Berechnung Premium-Anteil bis Periodenende
- Neue Periode beginnt mit Upgrade-Zeitpunkt

### 6.2 Downgrade (z. B. Premium → Basis)

- Wirksam zum Ende der aktuellen Periode
- Bis dahin: Premium-Zugang bleibt
- Nach Downgrade: Features eingeschränkt, Rezepte bleiben (read-only wenn > 3)

### 6.3 Wechsel jährlich ↔ monatlich

- Wechsel zum Periodenende
- Keine anteilige Verrechnung bei Zykluswechsel

---

## 7. Kündigung

### 7.1 Kündigungsflow

1. Nutzer: `/mein-bereich/mitgliedschaft` → „Mitgliedschaft kündigen“
2. Bestätigungsdialog mit Hinweis auf Verlust von Features
3. Optional: Kündigungsgrund (Feedback)
4. `cancel_at_period_end = true`
5. Bestätigungs-E-Mail mit Enddatum
6. Zugang bis Periodenende

### 7.2 Reaktivierung

- Vor Periodenende: Kündigung widerrufbar
- Nach Ablauf: Neues Abo abschließen (kein automatisches Resume)

### 7.3 Widerrufsrecht

- 14 Tage Widerrufsrecht bei Erstabonnement
- Vollständige Erstattung bei Widerruf innerhalb Frist
- Formular unter `/widerruf`

---

## 8. Grace Period

### 8.1 Ablauf

1. Zahlung fehlgeschlagen (Karte abgelaufen, insufficient funds)
2. Status → `past_due`
3. E-Mail: „Zahlung fehlgeschlagen, bitte aktualisieren“
4. Grace Period: 7 Tage
5. Während Grace Period:
   - Lesezugriff auf Inhalte
   - Keine neuen Rezepte, Forum-Posts, DMs
6. Nach 7 Tagen ohne erfolgreiche Zahlung: Status → `expired`

### 8.2 Wiederherstellung

- Nutzer aktualisiert Zahlungsmethode
- Erfolgreiche Zahlung → Status → `active`
- Voller Zugang wiederhergestellt

---

## 9. Feature-Matrix (vollständig)

| Feature | Gast | Basis | Premium | Meister |
|---------|------|-------|---------|---------|
| **Community** |
| Forum lesen (öffentlich) | ✓ | ✓ | ✓ | ✓ |
| Forum beitragen | – | ✓ | ✓ | ✓ |
| Direktnachrichten | – | ✓ | ✓ | ✓ |
| Profil | – | ✓ | ✓ | ✓ |
| **Werkstatt** |
| Salzrechner | ✓ | ✓ | ✓ | ✓ |
| Affiliate-Katalog | ✓ | ✓ | ✓ | ✓ |
| Lakerechner | – | – | ✓ | ✓ |
| Rezeptgenerator | – | ○¹ | ✓ | ✓ |
| Marinaden-Generator | – | – | ✓ | ✓ |
| Rezeptdatenbank lesen | – | – | ✓ | ✓ |
| Rezeptdatenbank veröffentlichen | – | – | – | ✓ |
| Rezeptanalyse | – | – | – | ✓ |
| **Akademie** |
| Kostenlose Kurse | ✓ | ✓ | ✓ | ✓ |
| Basis-Kurse | – | ✓ | ✓ | ✓ |
| Premium-Kurse | – | – | ✓ | ✓ |
| Alle Kurse | – | – | – | ✓ |
| Frühzugang | – | – | – | ✓ (14 Tage) |
| Zertifikate | – | ✓ | ✓ | ✓ |
| **Meisterclub** |
| Exklusive Inhalte | – | – | – | ✓ |
| Live-Sessions | – | – | – | ✓ |
| Mentoring | – | – | – | ✓ |
| Rankings | – | – | – | ✓ |
| **Support** |
| Ticket erstellen | – | ✓ | ✓ | ✓ |
| Priorität | – | Standard | Priorisiert | Priorisiert+ |

¹ Max. 3 Rezepte, kein PDF

---

## 10. Admin-Funktionen

### 10.1 Pläne verwalten

- Preise anpassen (wirksam für Neukunden)
- Features-Liste pflegen
- Zugangsregeln konfigurieren
- Plan aktivieren/deaktivieren

### 10.2 Manuelle Zuweisung

- Admin kann Mitgliedschaft zuweisen (z. B. Partnerschaften, Gewinne)
- Felder: Plan, Dauer, Begründung
- Audit-Log

### 10.3 Meisterclub-Override

- Temporärer Meisterclub-Zugang ohne Meister-Abo
- Felder: Nutzer, Ablaufdatum, Begründung
- Anwendungsfälle: Testimonials, Influencer, Support-Eskalation

### 10.4 Reporting

| Metrik | Beschreibung |
|--------|--------------|
| Aktive Abos | Pro Plan |
| MRR | Monthly Recurring Revenue |
| Churn | Kündigungen / Aktive |
| Upgrades/Downgrades | Pro Zeitraum |
| Trial-Conversions | Wenn Trial aktiv |
| LTV | Lifetime Value pro Plan |

---

## 11. Newsletter-Integration

| Event | Segment-Aktion |
|-------|----------------|
| Abo gestartet | Tag `member_{plan}` setzen |
| Upgrade | Tag aktualisieren |
| Kündigung | Tag `churned` setzen |
| Grace Period | Automation: Zahlungserinnerung |

---

## 12. Migration (PMPro)

| PMPro | Alles-Wurst 2.0 |
|-------|-----------------|
| pmpro_membership_level | MembershipPlan |
| pmpro_memberships_users | Membership |
| Level 1 (Basis) | `basis` |
| Level 2 (Premium) | `premium` |
| Level 3 (Meister) | `meister` |

**Besonderheiten:**
- Ablaufdaten übernehmen
- Zahlungsanbieter-IDs migrieren (wenn möglich)
- Grace Period nicht migrieren (Neustart)

---

*Das Mitgliedschaftssystem wird in Roadmap Phase 1 (Basis) und Phase 3 (vollständig) implementiert.*
