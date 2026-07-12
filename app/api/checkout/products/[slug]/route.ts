import { getProductBySlug } from "@/lib/payments/product-catalog-service";
import { jsonFromCheckoutResult } from "@/lib/payments/checkout-api-utils";

type RouteContext = { params: Promise<{ slug: string }> };

/**
 * GET /api/checkout/products/[slug] — Einzelnes Produkt mit Preisen.
 */
export async function GET(
  _request: Request,
  context: RouteContext,
): Promise<Response> {
  const { slug } = await context.params;
  const result = await getProductBySlug(slug);

  return jsonFromCheckoutResult(result);
}
