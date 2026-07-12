/**
 * @file format-money.ts
 * @purpose Währungsformatierung für Checkout-UI.
 */

export function formatMoney(amount: number, currency: string): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency,
  }).format(amount);
}
