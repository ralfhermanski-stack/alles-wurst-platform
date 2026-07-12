/**
 * @file certificate-number.ts
 * @purpose Fortlaufende Nummern: Zertifikate AW-Z-YYYY-000001, Urkunden AW-U-YYYY-000001.
 */

import { Prisma } from "@prisma/client";

import type { CertificateKind } from "./certificate-types";

/**
 * Sequenz-Zeile pro Nachweistyp. "default" bleibt für Zertifikate erhalten,
 * damit bestehende AW-Z-Nummern nicht kollidieren.
 */
function sequenceIdForKind(kind: CertificateKind): string {
  return kind === "participation" ? "urkunde" : "default";
}

function prefixForKind(kind: CertificateKind): string {
  return kind === "participation" ? "AW-U" : "AW-Z";
}

export async function allocateCertificateNumber(
  tx: Prisma.TransactionClient,
  kind: CertificateKind = "certificate",
): Promise<string> {
  const year = new Date().getFullYear();
  const sequenceId = sequenceIdForKind(kind);

  const existing = await tx.certificateSequence.findUnique({
    where: { id: sequenceId },
  });

  const nextNumber =
    existing?.sequenceYear === year ? existing.currentNumber + 1 : 1;

  await tx.certificateSequence.upsert({
    where: { id: sequenceId },
    create: {
      id: sequenceId,
      sequenceYear: year,
      currentNumber: nextNumber,
    },
    update: {
      sequenceYear: year,
      currentNumber: nextNumber,
    },
  });

  return `${prefixForKind(kind)}-${year}-${String(nextNumber).padStart(6, "0")}`;
}
