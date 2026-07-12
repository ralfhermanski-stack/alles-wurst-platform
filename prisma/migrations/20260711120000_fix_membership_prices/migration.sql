-- Korrigierte Mitgliedschaftspreise (wie Startseite / Platzhalterkatalog)

UPDATE "product_prices"
SET
  "gross_amount" = 19.90,
  "net_amount" = 16.72,
  "tax_rate" = 19.00,
  "tax_amount" = 3.18,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = 'b1000000-0000-4000-8000-000000000001';

UPDATE "product_prices"
SET
  "gross_amount" = 189.00,
  "net_amount" = 158.82,
  "tax_rate" = 19.00,
  "tax_amount" = 30.18,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = 'b1000000-0000-4000-8000-000000000002';

UPDATE "product_prices"
SET
  "gross_amount" = 49.00,
  "net_amount" = 41.18,
  "tax_rate" = 19.00,
  "tax_amount" = 7.82,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = 'b1000000-0000-4000-8000-000000000003';

UPDATE "product_prices"
SET
  "gross_amount" = 490.00,
  "net_amount" = 411.76,
  "tax_rate" = 19.00,
  "tax_amount" = 78.24,
  "updated_at" = CURRENT_TIMESTAMP
WHERE "id" = 'b1000000-0000-4000-8000-000000000004';
