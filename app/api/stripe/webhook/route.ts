import { processStripeWebhook } from "@/lib/stripe/stripe-webhook-service";

export const runtime = "nodejs";

/**
 * POST /api/stripe/webhook — Stripe-Events (Signaturpflicht, keine Session-Auth).
 */
export async function POST(request: Request): Promise<Response> {
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  try {
    const result = await processStripeWebhook(rawBody, signature);

    return Response.json({
      received: result.received,
      eventId: result.eventId,
      duplicate: result.duplicate,
      status: result.status,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook-Verarbeitung fehlgeschlagen.";

    console.error("[stripe/webhook] Fehler:", message);

    return Response.json({ error: message }, { status: 400 });
  }
}
