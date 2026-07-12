import { listActiveProducts } from "@/lib/payments/product-catalog-service";
import { jsonFromCheckoutResult } from "@/lib/payments/checkout-api-utils";

/**
 * GET /api/checkout/products — Aktive Produkte mit Preisen.
 */
export async function GET(): Promise<Response> {
  const result = await listActiveProducts();

  return jsonFromCheckoutResult(result);
}
