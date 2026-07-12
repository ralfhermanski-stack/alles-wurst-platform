# Stripe — Online-Zahlungen & sichere Schlüsselverwaltung

## Schlüsseltypen

| Typ | Präfix | Verwendung |
|-----|--------|------------|
| **Publishable Key** | `pk_test_` / `pk_live_` | Nur Frontend (Checkout.js o. ä.) — bei uns: `NEXT_PUBLIC_*` |
| **Restricted API Key** | `rk_test_` / `rk_live_` | **Bevorzugt** serverseitig — minimale Rechte |
| **Secret Key** | `sk_test_` / `sk_live_` | Nur Fallback, wenn kein Restricted Key möglich |
| **Webhook Signing Secret** | `whsec_` | **Kein API-Key** — nur Webhook-Signaturprüfung |

**Warnung:** Keys niemals per Mail, Chat oder Git teilen.

## Schlüssel eintragen (empfohlen)

**System → Stripe** (`/admin/stripe`) — oben im Formular „Stripe-Schlüssel eintragen“:

1. Modus wählen (Test oder Live)
2. **Öffentlicher Schlüssel** (`pk_test_...` / `pk_live_...`)
3. **Geheimer Server-Schlüssel** (`rk_...` bevorzugt, oder `sk_...`)
4. **Webhook-Geheimnis** (`whsec_...`)
5. **Speichern**

Gespeicherte Schlüssel werden **verschlüsselt in der Datenbank** abgelegt und **nicht erneut angezeigt**. Zum Ersetzen einfach neue Werte eintragen und speichern.

## Alternative: Umgebungsvariablen (.env)

Falls gewünscht, weiterhin möglich (Admin-Speicherung hat Vorrang):

```env
STRIPE_MODE=test

# Testmodus
STRIPE_PUBLISHABLE_KEY_TEST="pk_test_..."
STRIPE_RESTRICTED_KEY_TEST="rk_test_..."
STRIPE_SECRET_KEY_TEST=""                    # nur Fallback
STRIPE_WEBHOOK_SECRET_TEST="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST="pk_test_..."

# Livemodus
STRIPE_PUBLISHABLE_KEY_LIVE="pk_live_..."
STRIPE_RESTRICTED_KEY_LIVE="rk_live_..."
STRIPE_SECRET_KEY_LIVE=""                    # nur Fallback
STRIPE_WEBHOOK_SECRET_LIVE="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE="pk_live_..."
```

### Regeln

- Server bevorzugt `STRIPE_RESTRICTED_KEY_*`, Fallback `STRIPE_SECRET_KEY_*`
- Frontend nur `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_*` — niemals `rk_`, `sk_`, `whsec_`
- `STRIPE_MODE=test` akzeptiert nur Test-Keys (`pk_test_`, `rk_test_`/`sk_test_`, `whsec_`)
- `STRIPE_MODE=live` akzeptiert nur Live-Keys
- Falsche Kombination → Checkout deaktiviert, Admin-Warnung
- `STRIPE_MODE` in ENV überschreibt die Admin-Modus-Umschaltung

Der Admin-Modus wird in `stripe_settings.active_mode` gespeichert und unter **System → Stripe** verwaltet.

## Restricted API Key erstellen (Empfehlung)

Im [Stripe Dashboard → API Keys → Restricted keys](https://dashboard.stripe.com/apikeys) einen Key mit **minimalen Rechten** anlegen:

| Ressource | Rechte |
|-----------|--------|
| Checkout Sessions | Write |
| Payment Intents | Read |
| Customers | Write |
| Charges | Read |
| Refunds | Read |
| Subscriptions | Read, Write (für Mitgliedschaften als Abo) |
| Invoices | Read (für Abo-Verlängerungen) |
| Balance | Read (für API-Test im Admin) |

Keine weiteren Rechte vergeben (kein Refund Write, kein Customer Delete, etc., sofern nicht benötigt).

## Webhook Secret

- **Nicht** als API-Key verwenden
- Nur in `app/api/stripe/webhook` / `stripe-webhook-service.ts`
- Pro Modus eigenes Secret: `STRIPE_WEBHOOK_SECRET_TEST` / `STRIPE_WEBHOOK_SECRET_LIVE`
- Webhook-Verifizierung nutzt `Stripe.webhooks.constructEvent()` — **ohne** Server-API-Key

### Webhook-URL

```
https://<deine-domain>/api/stripe/webhook
```

Lokal mit Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Das ausgegebene `whsec_...` als `STRIPE_WEBHOOK_SECRET_TEST` in `.env` eintragen.

## Events im Stripe-Dashboard aktivieren

| Event | Zweck |
|-------|--------|
| `checkout.session.completed` | Haupt-Freischaltung nach Checkout |
| `checkout.session.async_payment_succeeded` | Verzögerte Zahlungsmethoden (z. B. SEPA) |
| `checkout.session.async_payment_failed` | Async-Zahlung fehlgeschlagen |
| `payment_intent.succeeded` | Zahlungsbestätigung / Stripe-Felder |
| `payment_intent.payment_failed` | Fehlgeschlagene Zahlung |
| `charge.refunded` | Rückerstattung → Buchhaltung, Admin-Prüfung |
| `customer.subscription.created` | Abo angelegt |
| `customer.subscription.updated` | Abo geändert |
| `customer.subscription.deleted` | Abo beendet |
| `invoice.paid` | Abo-Verlängerung |
| `invoice.payment_failed` | Abo-Rechnung fehlgeschlagen |

## Datenfluss

```
Nutzer → POST /api/checkout (auth, Preis aus DB)
      → Stripe Checkout Session (Metadata, Restricted Key serverseitig)
      → Redirect zu Stripe
      → Success-URL: nur Statusanzeige (/kaufen/status/[id]?stripe=return)
      → Webhook (whsec_, Signatur) → Idempotenz → Freischaltung
```

**Wichtig:** Die Success-URL schaltet **niemals** frei.

## Schlüsselrotation (ohne Downtime)

1. Neuen Restricted Key + ggf. neues Webhook Secret im Stripe Dashboard erstellen
2. Neue Werte in ENV eintragen (alte Keys vorerst behalten)
3. Server neu starten
4. Im Admin: API-Test + Testzahlung ausführen
5. Webhook-Eingang prüfen
6. Erst danach alte Keys im Stripe Dashboard rotieren/löschen
7. Interne Notiz unter **Admin → Stripe → Schlüssel-Notizen** pflegen (ohne Keys zu speichern)

Bei Fehlern: klare Meldung im Admin, Checkout bleibt deaktiviert, Überweisung/manuell funktionieren weiter.

## Testmodus einrichten

1. `STRIPE_MODE=test` setzen
2. Test-Keys (`pk_test_`, `rk_test_`, `whsec_`) in `.env`
3. `stripe listen --forward-to localhost:3000/api/stripe/webhook`
4. Admin: API-Test, Testzahlung
5. Testkarte: `4242 4242 4242 4242`

## Livemodus einrichten

1. Restricted Live Key (`rk_live_`) erstellen — Secret Key nur als Fallback
2. `STRIPE_MODE=live` setzen
3. Live-Webhook-Endpunkt im Dashboard mit `STRIPE_WEBHOOK_SECRET_LIVE`
4. Admin: Live-Warnung beachten, API-Test, echte Testzahlung mit kleinem Betrag

## Admin

**System → Stripe** (`/admin/stripe`):

- Aktiver/effectiver Modus
- Maskierte Keys (`pk_live_****abcd`)
- Server-Key-Typ (Restricted / Secret / fehlt)
- Warnungen (Secret statt Restricted, fehlendes Webhook Secret)
- API-Test, Webhook-Status, Testzahlungen

## Sicherheit & Schutz vor Leaks

- `.env`, `.env.local`, `.env.production`, `.env.test` sind in `.gitignore`
- Secret-Scan: `node scripts/check-stripe-secrets.cjs`
- Integrationstests: `node scripts/test-stripe-integration.cjs`
- Preis immer aus Datenbank
- Webhook ohne Login, mit Stripe-Signatur
- Secrets werden in Logs maskiert (`sk_****`, `rk_****`, `whsec_****`)

## Testanleitung

| Szenario | Erwartung |
|----------|-----------|
| Testmodus + `pk_test_` + `rk_test_` | Checkout aktiv |
| Testmodus + `pk_live_` | Blockiert |
| Livemodus + `pk_live_` + `rk_live_` | Checkout aktiv |
| Livemodus + `pk_test_` | Blockiert |
| Fehlendes Webhook Secret | Checkout deaktiviert |
| Falsche Webhook-Signatur | HTTP 400 |
| Secret Key Fallback (ohne rk_) | Warnung im Admin, funktioniert |
| Doppelter Webhook | Idempotent, keine Doppel-Freischaltung |
