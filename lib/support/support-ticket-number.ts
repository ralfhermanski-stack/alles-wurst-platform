/**
 * @file support-ticket-number.ts
 * @purpose Ticketnummern im Format AW-T-2026-000001.
 */

import { prisma } from "@/lib/db/prisma";

export async function generateSupportTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();

  const counter = await prisma.$transaction(async (tx) => {
    const existing = await tx.supportTicketCounter.findUnique({
      where: { year },
    });

    if (existing) {
      return tx.supportTicketCounter.update({
        where: { year },
        data: { lastNumber: { increment: 1 } },
      });
    }

    return tx.supportTicketCounter.create({
      data: { year, lastNumber: 1 },
    });
  });

  const padded = String(counter.lastNumber).padStart(6, "0");

  return `AW-T-${year}-${padded}`;
}
