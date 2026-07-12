/**
 * @file stripe-webhook-events.ts
 * @purpose Webhook-Events, die im Stripe-Dashboard aktiviert sein müssen.
 */

export type StripeWebhookEventSpec = {
  type: string;
  label: string;
  purpose: string;
};

export const STRIPE_REQUIRED_WEBHOOK_EVENTS: StripeWebhookEventSpec[] = [
  {
    type: "checkout.session.completed",
    label: "Checkout abgeschlossen",
    purpose: "Haupt-Freischaltung nach erfolgreichem Checkout",
  },
  {
    type: "checkout.session.async_payment_succeeded",
    label: "Async-Zahlung erfolgreich",
    purpose: "Verzögerte Zahlungsmethoden (z. B. SEPA)",
  },
  {
    type: "checkout.session.async_payment_failed",
    label: "Async-Zahlung fehlgeschlagen",
    purpose: "Fehlgeschlagene verzögerte Zahlung",
  },
  {
    type: "payment_intent.succeeded",
    label: "Payment Intent erfolgreich",
    purpose: "Zahlungsbestätigung und Stripe-Felder",
  },
  {
    type: "payment_intent.payment_failed",
    label: "Payment Intent fehlgeschlagen",
    purpose: "Fehlgeschlagene Zahlung",
  },
  {
    type: "charge.refunded",
    label: "Rückerstattung",
    purpose: "Rückerstattung → Buchhaltung",
  },
  {
    type: "customer.subscription.created",
    label: "Abo erstellt",
    purpose: "Mitgliedschaft als Abo angelegt",
  },
  {
    type: "customer.subscription.updated",
    label: "Abo aktualisiert",
    purpose: "Änderungen an Abonnements",
  },
  {
    type: "customer.subscription.deleted",
    label: "Abo beendet",
    purpose: "Abonnement beendet",
  },
  {
    type: "invoice.paid",
    label: "Rechnung bezahlt",
    purpose: "Abo-Verlängerung",
  },
  {
    type: "invoice.payment_failed",
    label: "Rechnung fehlgeschlagen",
    purpose: "Fehlgeschlagene Abo-Rechnung",
  },
];

export const STRIPE_REQUIRED_WEBHOOK_EVENT_TYPES = STRIPE_REQUIRED_WEBHOOK_EVENTS.map(
  (event) => event.type,
);
