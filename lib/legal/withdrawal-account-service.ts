/**
 * @file withdrawal-account-service.ts
 * @purpose Widerruf aus dem Benutzerkonto inkl. Ticket und Nachrichten.
 */

import { prisma } from "@/lib/db/prisma";
import { createUserAccountMessage } from "@/lib/account/account-message-service";
import {
  assertUserOwnsOrder,
  getUserOrderDetail,
} from "@/lib/account/account-order-service";
import { verifyOrderAccessToken } from "@/lib/account/secure-order-token";
import { sendMail } from "@/lib/mail/mail-service";
import { generateSupportTicketNumber } from "@/lib/support/support-ticket-number";
import {
  userFailure,
  userSuccess,
  type UserServiceResult,
} from "@/lib/users/user-errors";

export type WithdrawalPrefill = {
  firstName: string;
  lastName: string;
  email: string;
  orderReference: string;
  productName: string;
  orderDate: string;
  contractDate: string;
  orderId: string;
  accessStatus: string | null;
  withdrawalExpiredNotice: boolean;
};

function generateWithdrawalNumber(): string {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `WR-${stamp}-${random}`;
}

async function ensureWithdrawalCategoryId(): Promise<string | null> {
  const category = await prisma.supportTicketCategory.findFirst({
    where: { slug: "widerruf", isActive: true },
  });

  return category?.id ?? null;
}

async function createWithdrawalTicket(input: {
  userId: string;
  withdrawalId: string;
  orderId: string;
  withdrawalNumber: string;
  orderNumber: string;
  productName: string;
  courseAccessStatus: string | null;
}): Promise<string | null> {
  const categoryId = await ensureWithdrawalCategoryId();

  if (!categoryId) {
    return null;
  }

  const ticketNumber = await generateSupportTicketNumber();
  const body = [
    `Widerrufsvorgang: ${input.withdrawalNumber}`,
    `Bestellnummer: ${input.orderNumber}`,
    `Produkt: ${input.productName}`,
    `Kurszugriff: ${input.courseAccessStatus ?? "unbekannt"}`,
    "",
    `Admin: /admin/inhalte/rechtliches/widerrufe`,
    `Bestellung: /mein-bereich/bestellungen/${input.orderId}`,
  ].join("\n");

  const ticket = await prisma.supportTicket.create({
    data: {
      ticketNumber,
      userId: input.userId,
      categoryId,
      subject: `Widerruf zu Bestellung ${input.orderNumber}`,
      priority: "urgent",
      status: "open",
      waitingOn: "admin",
      withdrawalRequestId: input.withdrawalId,
      lastUserReplyAt: new Date(),
      messages: {
        create: {
          authorUserId: input.userId,
          authorType: "user",
          body,
          isReadByUser: true,
        },
      },
    },
  });

  return ticket.id;
}

export async function resolveWithdrawalPrefill(input: {
  userId: string;
  token: string;
}): Promise<UserServiceResult<WithdrawalPrefill>> {
  const payload = verifyOrderAccessToken(input.token);

  if (!payload || payload.userId !== input.userId) {
    return userFailure({
      code: "FORBIDDEN",
      message: "Der Bestellbezug ist ungültig oder abgelaufen.",
    });
  }

  const order = await getUserOrderDetail(input.userId, payload.orderId);

  if (!order.success) {
    return order;
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    include: { profile: true },
  });

  if (!user) {
    return userFailure({ code: "NOT_FOUND", message: "Benutzer nicht gefunden." });
  }

  return userSuccess({
    firstName: user.profile?.firstName ?? "",
    lastName: user.profile?.lastName ?? "",
    email: user.email,
    orderReference: order.data.orderNumber,
    productName: order.data.productName,
    orderDate: order.data.paidAt ?? order.data.createdAt,
    contractDate: order.data.paidAt ?? order.data.createdAt,
    orderId: order.data.id,
    accessStatus: order.data.accessStatus,
    withdrawalExpiredNotice: order.data.withdrawalExpiredNotice,
  });
}

export async function submitAccountWithdrawal(input: {
  userId: string;
  token: string;
  declarationText: string;
  message?: string | null;
  confirmed: boolean;
}): Promise<UserServiceResult<{ withdrawalNumber: string }>> {
  if (!input.confirmed) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Bitte bestätige die Widerrufserklärung.",
    });
  }

  const declarationText = input.declarationText.trim();

  if (!declarationText) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Die Widerrufserklärung ist erforderlich.",
    });
  }

  const payload = verifyOrderAccessToken(input.token);

  if (!payload || payload.userId !== input.userId) {
    return userFailure({
      code: "FORBIDDEN",
      message: "Der Bestellbezug ist ungültig oder abgelaufen.",
    });
  }

  const order = await getUserOrderDetail(input.userId, payload.orderId);

  if (!order.success) {
    return order;
  }

  if (!order.data.withdrawalEligible) {
    return userFailure({
      code: "VALIDATION_ERROR",
      message: "Für diese Bestellung ist aktuell kein Widerruf möglich.",
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    include: { profile: true },
  });

  if (!user) {
    return userFailure({ code: "NOT_FOUND", message: "Benutzer nicht gefunden." });
  }

  const position = await prisma.accountingPosition.findFirst({
    where: { id: payload.orderId, userId: input.userId },
    include: {
      checkoutIntent: {
        include: { purchaseLegalRecord: true, courseAccess: { take: 1 } },
      },
    },
  });

  const legalRecord = position?.checkoutIntent?.purchaseLegalRecord ?? null;
  const courseAccess = position?.checkoutIntent?.courseAccess[0] ?? null;
  const withdrawalNumber = generateWithdrawalNumber();

  const withdrawal = await prisma.withdrawalRequest.create({
    data: {
      withdrawalNumber,
      userId: input.userId,
      firstName: user.profile?.firstName ?? "—",
      lastName: user.profile?.lastName ?? "—",
      email: user.email,
      orderReference: order.data.orderNumber,
      productName: order.data.productName,
      orderDate: position?.paidAt ?? position?.createdAt,
      contractDate: position?.paidAt ?? position?.createdAt,
      message: input.message?.trim() || null,
      declarationText,
      status: "RECEIVED",
      source: "USER_ACCOUNT",
      accountingPositionId: payload.orderId,
      checkoutIntentId: position?.checkoutIntent?.id ?? null,
      purchaseLegalRecordId: legalRecord?.id ?? null,
      courseAccessStatus: courseAccess?.status ?? null,
      consentSnapshot: legalRecord?.consentSnapshot ?? undefined,
    },
  });

  let ticketCreationFailed = false;

  try {
    const ticketId = await createWithdrawalTicket({
      userId: input.userId,
      withdrawalId: withdrawal.id,
      orderId: payload.orderId,
      withdrawalNumber,
      orderNumber: order.data.orderNumber,
      productName: order.data.productName,
      courseAccessStatus: courseAccess?.status ?? null,
    });

    if (!ticketId) {
      ticketCreationFailed = true;
    }
  } catch {
    ticketCreationFailed = true;
  }

  if (ticketCreationFailed) {
    await prisma.withdrawalRequest.update({
      where: { id: withdrawal.id },
      data: { ticketCreationFailed: true },
    });
  }

  await createUserAccountMessage({
    userId: input.userId,
    messageType: "withdrawal_received",
    title: "Widerruf erhalten",
    body: `Wir haben deine Widerrufserklärung erhalten. Vorgangsnummer: ${withdrawalNumber}. Bestellung: ${order.data.orderNumber}.`,
    linkUrl: `/mein-bereich/bestellungen/${payload.orderId}`,
  });

  try {
    await sendMail({
      to: user.email,
      subject: `Widerruf erhalten — ${withdrawalNumber}`,
      text: `Wir haben deine Widerrufserklärung zu Bestellung ${order.data.orderNumber} erhalten. Vorgangsnummer: ${withdrawalNumber}. Der Vorgang wird geprüft.`,
      html: `<p>Wir haben deine Widerrufserklärung zu Bestellung <strong>${order.data.orderNumber}</strong> erhalten.</p><p>Vorgangsnummer: <strong>${withdrawalNumber}</strong></p><p>Der Vorgang wird geprüft. Es erfolgt noch keine Zusage zu Erstattung oder Annahme.</p>`,
    });
  } catch {
    // E-Mail-Fehler darf Widerruf nicht verhindern
  }

  return userSuccess({ withdrawalNumber });
}

export async function validateOrderTokenForUser(
  userId: string,
  token: string,
): Promise<UserServiceResult<{ orderId: string }>> {
  const payload = verifyOrderAccessToken(token);

  if (!payload || payload.userId !== userId) {
    return userFailure({
      code: "FORBIDDEN",
      message: "Ungültiger Bestellbezug.",
    });
  }

  const ownership = await assertUserOwnsOrder(userId, payload.orderId);

  if (!ownership.success) {
    return ownership;
  }

  return userSuccess({ orderId: ownership.data.positionId });
}
