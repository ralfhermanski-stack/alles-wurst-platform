# Zahlungssystem – Alles-Wurst 2.0

**Version:** 1.0  
**Stand:** Juli 2026  
**Status:** Planungsphase (keine Implementierung)  
**Bezug:** `MITGLIEDSCHAFTEN.md`, `DATENMODELL.md`  

---

## 1. Übersicht

Das Zahlungssystem verarbeitet alle kommerziellen Transaktionen der Plattform: Mitgliedschaftsabonnements, Einzelkurskäufe und erzeugt automatisch Rechnungen. Es ist konform mit deutschen Steuer- und Buchhaltungsanforderungen.

### 1.1 Ziele

- Sichere, zuverlässige Zahlungsabwicklung
- Automatische Abonnement-Verwaltung
- Steuerkonforme Rechnungserstellung
- Transparente Zahlungshistorie für Nutzer
- Einfache Admin-Verwaltung

### 1.2 Zahlungsanbieter (Empfehlung)

| Anbieter | Stärken | Verwendung |
|----------|---------|------------|
| **Stripe** | Umfangreiche API, Subscriptions, EU | Primär |
| **Mollie** | EU-fokussiert, SEPA, iDEAL | Alternative/Ergänzung |

> In der Planungsphase werden keine APIs angebunden.

---

## 2. Zahlungsmethoden

### 2.1 Unterstützte Methoden

| Methode | Einmalzahlung | Abonnement | Gebühren (ca.) |
|---------|---------------|------------|----------------|
| Kreditkarte (Visa, MC) | ✓ | ✓ | 1,4 % + 0,25 € |
| SEPA-Lastschrift | ✓ | ✓ | 0,35 € |
| PayPal | ✓ | ✓ | 2,49 % + 0,35 € |
| Apple Pay / Google Pay | ✓ | ✓ | Wie Kreditkarte |

### 2.2 Nicht unterstützt (Phase 1)

- Rechnung/Vorkasse (manuell im Admin möglich)
- Kryptowährungen
- Ratenzahlung

---

## 3. Produkttypen

### 3.1 Mitgliedschaftsabonnements

| Plan | Monatlich | Jährlich |
|------|-----------|----------|
| Basis | 9,90 € | 99,00 € |
| Premium | 19,90 € | 199,00 € |
| Meister | 39,90 € | 399,00 € |

- Wiederkehrende Zahlung
- Automatische Verlängerung
- Kündigung zum Periodenende

### 3.2 Einzelkurse

- Einmalzahlung
- Preis pro Kurs (konfigurierbar, z. B. 19,90–99,00 €)
- Dauerhafter Zugang nach Kauf

### 3.3 Rabatte

| Rabatt | Bedingung | Höhe |
|--------|-----------|------|
| Mitgliedschafts-Rabatt Basis | Einzelkurskauf | 10 % |
| Mitgliedschafts-Rabatt Premium | Einzelkurskauf | 20 % |
| Jahresabo | Jährliche Zahlung | ~17 % |
| Gutscheincode | Manuell (Admin) | Variabel |

---

## 4. Checkout-Flow

### 4.1 Mitgliedschaft

```
┌─────────────────┐
│ Mitgliedschaft  │
│ Plan wählen     │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Login/Register  │ (wenn nicht eingeloggt)
└────────┬────────┘
         ↓
┌─────────────────┐
│ Checkout-Seite  │
│ - Plan-Details  │
│ - Zyklus wählen │
│ - Zahlungsmethode│
│ - AGB-Checkbox  │
└────────┬────────┘
         ↓
┌─────────────────┐
│ Zahlungsanbieter│ (Stripe Checkout / Elements)
└────────┬────────┘
         ↓
    ┌────┴────┐
    │ Erfolg  │ → Membership aktiv, Rechnung, Willkommens-E-Mail
    └─────────┘
    │ Fehler  │ → Fehlermeldung, Retry
    └─────────┘
```

### 4.2 Einzelkurs

```
Kursdetail → „Jetzt kaufen“ → Login → Checkout → Zahlung → Enrollment + Rechnung
```

### 4.3 Checkout-Seite Elemente

| Element | Beschreibung |
|---------|--------------|
| Produktzusammenfassung | Plan/Kurs, Features |
| Preis | Netto, MwSt., Brutto |
| Abrechnungszyklus | Monatlich/Jährlich (bei Abo) |
| Zahlungsmethode | Auswahl / Eingabe |
| Rechnungsadresse | Name, Straße, PLZ, Ort, Land |
| Gutscheincode | Optional |
| AGB-Checkbox | Pflicht |
| Widerrufshinweis | Link |
| CTA | „Jetzt bezahlen“ |

---

## 5. Abonnement-Verwaltung

### 5.1 Erstellung

1. Erfolgreiche Erstzahlung
2. Webhook von Zahlungsanbieter
3. `Subscription` bei Anbieter erstellt
4. `Membership` in Plattform erstellt (Status: `active`)
5. `Order`, `Invoice`, `Payment` erstellt

### 5.2 Verlängerung

1. Anbieter zieht Betrag ein (Periodenende)
2. Webhook: `invoice.paid`
3. `Membership.current_period_end` aktualisiert
4. Neue `Invoice` erstellt
5. E-Mail: Zahlungsbestätigung

### 5.3 Fehlgeschlagene Zahlung

1. Webhook: `invoice.payment_failed`
2. `Membership.status` → `past_due`
3. `Membership.grace_period_ends` = jetzt + 7 Tage
4. E-Mail: Zahlung fehlgeschlagen, bitte aktualisieren
5. Retry: Anbieter versucht erneut (3× über 7 Tage)
6. Nach Grace Period: Status → `expired`

### 5.4 Kündigung

1. Nutzer kündigt in `/mein-bereich/mitgliedschaft`
2. `Membership.cancel_at_period_end` = true
3. Anbieter: Subscription cancel at period end
4. E-Mail: Kündigungsbestätigung mit Enddatum
5. Am Periodenende: Status → `expired`

### 5.5 Upgrade/Downgrade

**Upgrade (sofort):**
1. Nutzer wählt höheren Plan
2. Proration berechnen
3. Differenz sofort berechnen
4. `Membership.plan_id` aktualisieren
5. Sofortiger Feature-Zugang

**Downgrade (zum Periodenende):**
1. Nutzer wählt niedrigeren Plan
2. `scheduled_plan_id` setzen
3. Am Periodenende: Plan wechseln

---

## 6. Rechnungen

### 6.1 Automatische Erstellung

Rechnungen werden automatisch erstellt bei:
- Erfolgreicher Erstzahlung
- Abonnement-Verlängerung
- Einzelkurskauf
- Manueller Erstellung (Admin)

### 6.2 Rechnungsnummer

Format: `AW-INV-YYYY-NNNNN`

Beispiel: `AW-INV-2026-00042`

- Fortlaufend pro Jahr
- Keine Lücken (revisionssicher)

### 6.3 Rechnungsinhalt (Pflichtangaben DE)

| Feld | Beschreibung |
|------|--------------|
| Rechnungsnummer | AW-INV-YYYY-NNNNN |
| Rechnungsdatum | Ausstellungsdatum |
| Leistungsdatum | Datum der Leistung |
| Verkäufer | Alles-Wurst, Adresse, USt-IdNr. |
| Käufer | Name, Adresse |
| Positionen | Beschreibung, Menge, Einzelpreis, Gesamt |
| Nettobetrag | Summe netto |
| Steuersatz | 19 % MwSt. |
| Steuerbetrag | MwSt.-Betrag |
| Bruttobetrag | Summe brutto |
| Zahlungsstatus | Bezahlt / Offen |
| Zahlungsmethode | Karte, SEPA, PayPal |

### 6.4 Rechnungs-PDF

- Layout gemäß Corporate Design
- Logo, Firmendaten
- QR-Code (optional, für Banking)
- Automatisch generiert und gespeichert
- Abrufbar in `/mein-bereich/rechnungen`

### 6.5 Storno / Gutschrift

**Storno:**
- Originalrechnung erhält Status `cancelled`
- Gutschrift erstellt (negative Positionen)
- Gutschrift-Nummer: `AW-CRN-YYYY-NNNNN`
- Verknüpfung: `credit_note_for` → Original

**Anwendungsfälle:**
- Widerruf innerhalb 14 Tage
- Doppelbuchung
- Kulanz-Erstattung

---

## 7. Webhooks

### 7.1 Stripe-Events (Beispiel)

| Event | Aktion |
|-------|--------|
| `checkout.session.completed` | Order erstellen, Zugang gewähren |
| `invoice.paid` | Invoice erstellen, Membership verlängern |
| `invoice.payment_failed` | Grace Period starten |
| `customer.subscription.updated` | Plan-Änderung synchronisieren |
| `customer.subscription.deleted` | Membership beenden |
| `charge.refunded` | Payment status → refunded |

### 7.2 Webhook-Sicherheit

- Signatur-Verifizierung (Stripe-Signature)
- Idempotenz (Event-ID speichern, Duplikate ignorieren)
- Retry-Log bei Fehlern
- Webhook-Log im Admin

---

## 8. Nutzer-Bereich

### 8.1 Zahlungsmethoden (`/mein-bereich/mitgliedschaft`)

- Hinterlegte Karte anzeigen (maskiert)
- Neue Karte hinzufügen
- Standard-Zahlungsmethode ändern
- SEPA-Mandat verwalten

### 8.2 Rechnungshistorie (`/mein-bereich/rechnungen`)

| Spalte | Beschreibung |
|--------|--------------|
| Rechnungsnummer | AW-INV-... |
| Datum | Ausstellungsdatum |
| Beschreibung | Plan/Kurs |
| Betrag | Brutto |
| Status | Bezahlt, Storniert |
| Aktion | PDF herunterladen |

### 8.3 Mitgliedschaft verwalten

- Aktueller Plan anzeigen
- Nächstes Abrechnungsdatum
- Upgrade/Downgrade
- Kündigen
- Reaktivieren (wenn gekündigt, vor Ablauf)

---

## 9. Admin-Bereich

### 9.1 Bestellungen (`/admin/zahlungen/bestellungen`)

- Liste aller Orders
- Filter: Status, Typ, Zeitraum
- Detail: Positionen, Zahlung, Nutzer
- Aktion: Erstatten

### 9.2 Rechnungen (`/admin/zahlungen/rechnungen`)

- Liste aller Invoices
- Filter: Status, Zeitraum
- PDF herunterladen
- Manuell erstellen (Sonderfälle)
- Storno/Gutschrift

### 9.3 Abonnements (`/admin/zahlungen/abonnements`)

- Aktive Abos
- Past Due (fehlgeschlagene Zahlungen)
- Grace Periods
- Manuell verlängern/kündigen

### 9.4 Einstellungen

| Einstellung | Beschreibung |
|-------------|--------------|
| API-Keys | Stripe/Mollie Secret, Publishable |
| Webhook-Secret | Signatur-Verifizierung |
| Firmendaten | Name, Adresse, USt-IdNr., Bankverbindung |
| Steuersatz | 19 % (default) |
| Rechnungsnummern | Präfix, Startnummer |
| Währung | EUR |

### 9.5 Reporting

| Metrik | Beschreibung |
|--------|--------------|
| MRR | Monthly Recurring Revenue |
| ARR | Annual Recurring Revenue |
| Umsatz | Brutto pro Zeitraum |
| Avg. Order Value | Durchschnittlicher Bestellwert |
| Refund Rate | Erstattungen / Umsatz |
| Churn Revenue | Verlorener Umsatz durch Kündigungen |

---

## 10. Steuer und Buchhaltung

### 10.1 Umsatzsteuer

- Standard: 19 % MwSt. (digitale Dienstleistungen DE)
- B2B EU mit USt-IdNr.: Reverse Charge (Phase 2)
- Export außerhalb EU: Steuerfrei (Phase 2)

### 10.2 Export

- DATEV-Export (CSV)
- Umsatzsteuer-Voranmeldung (Zusammenfassung)
- Jahresabschluss-Export

---

## 11. Sicherheit

| Maßnahme | Beschreibung |
|----------|--------------|
| PCI DSS | Keine Kreditkartendaten auf eigenen Servern (Stripe Elements) |
| HTTPS | Verschlüsselte Übertragung |
| Webhook-Signatur | Verifizierung aller Webhooks |
| Audit-Log | Alle Zahlungsaktionen protokolliert |
| Betrugsprävention | Stripe Radar (optional) |

---

## 12. Migration (PMPro/WooCommerce)

| Alt | Neu |
|-----|-----|
| pmpro_membership_order | Order |
| pmpro_memberships_users | Membership |
| WooCommerce Order | Order (Typ: course) |
| Rechnungen (manuell) | Invoice (Neuerstellung empfohlen) |

**Besonderheiten:**
- Zahlungsanbieter-IDs übernehmen (wenn Stripe)
- Aktive Abos nahtlos migrieren
- Historische Rechnungen als PDF archivieren

---

*Das Zahlungssystem wird in Roadmap Phase 1 (Basis) und Phase 3 (vollständig) implementiert.*
