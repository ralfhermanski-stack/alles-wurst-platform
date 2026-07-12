/**
 * @file stripe-mail.ts
 * @purpose Bestätigungsmail nach Stripe-Zahlung.
 */

import { prisma } from "@/lib/db/prisma";
import { buildAppUrl, sendMail } from "@/lib/mail/mail-service";

export async function sendStripePurchaseConfirmationMail(input: {
  userId: string;
  email: string;
  productName: string;
  amount: number;
  currency: string;
  checkoutIntentId: string;
}): Promise<void> {
  let to = input.email.trim();

  if (!to) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { email: true },
    });

    to = user?.email ?? "";
  }

  if (!to) {
    return;
  }

  const formattedAmount = new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: input.currency,
  }).format(input.amount);

  const statusUrl = buildAppUrl(`/kaufen/status/${input.checkoutIntentId}`);
  const dashboardUrl = buildAppUrl("/mein-bereich");

  const subject = `Kaufbestätigung: ${input.productName}`;

  const text = [
    "Hallo,",
    "",
    "vielen Dank für deinen Kauf bei Alles Wurst.",
    "",
    `Produkt: ${input.productName}`,
    `Betrag: ${formattedAmount}`,
    "",
    "Dein Zugang wurde freigeschaltet. Du findest alles in deinem Mein-Bereich:",
    dashboardUrl,
    "",
    `Bestelldetails: ${statusUrl}`,
    "",
    "Bei Fragen melde dich gerne bei unserem Support.",
    "",
    "Dein Alles-Wurst-Team",
  ].join("\n");

  await sendMail({
    to,
    subject,
    text,
    html: text.replace(/\n/g, "<br>"),
    actionLink: dashboardUrl,
  });
}
