import { NextResponse } from "next/server";

import { authorizeEmailWebhook } from "@/lib/email/email-webhook-auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request): Promise<Response> {
  const auth = authorizeEmailWebhook(request);

  if (!auth.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: auth.status });
  }

  let body: {
    type?: string;
    email?: string;
    messageId?: string;
    providerEventId?: string;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (body.messageId) {
    await prisma.emailDeliveryEvent.create({
      data: {
        emailMessageId: body.messageId,
        providerEventId: body.providerEventId ?? null,
        eventType:
          body.type === "bounce"
            ? "BOUNCED"
            : body.type === "complaint"
              ? "COMPLAINED"
              : body.type === "delivered"
                ? "DELIVERED"
                : "DEFERRED",
        occurredAt: new Date(),
        metadata: { source: "webhook" },
      },
    });

    if (body.type === "bounce" || body.type === "complaint") {
      const message = await prisma.emailMessage.findUnique({
        where: { id: body.messageId },
      });

      if (message) {
        const { suppressEmailAddress } = await import(
          "@/lib/email/email-suppression-service"
        );

        await suppressEmailAddress({
          email: message.recipientEmail,
          reason: body.type === "complaint" ? "COMPLAINT" : "HARD_BOUNCE",
          source: "provider-webhook",
        });

        await prisma.emailMessage.update({
          where: { id: message.id },
          data: {
            status: body.type === "complaint" ? "COMPLAINED" : "BOUNCED",
          },
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
