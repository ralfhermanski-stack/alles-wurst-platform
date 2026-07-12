/**
 * @file order-legal-document-service.ts
 */

import PDFDocument from "pdfkit";

import { prisma } from "@/lib/db/prisma";
import { buildContractConfirmationView } from "@/lib/legal/contract-confirmation-service";
import { renderContractConfirmationPdf } from "@/lib/legal/contract-pdf-renderer";
import { computeLegalChecksum } from "@/lib/legal/legal-checksum";
import { getPublishedLegalDocumentByType } from "@/lib/legal/legal-document-service";
import { getInvoiceSellerConfig } from "@/lib/invoices/invoice-config";
import { formatOrderNumber } from "./account-order-service";
import {
  readOrderLegalPdf,
  saveOrderLegalPdf,
} from "./order-legal-document-storage";

import type { LegalDocumentType, OrderLegalDocumentType } from "@prisma/client";

const DOC_TYPE_MAP: Array<{
  legalType: LegalDocumentType;
  orderType: OrderLegalDocumentType;
  title: string;
}> = [
  {
    legalType: "TERMS_AND_CONDITIONS",
    orderType: "TERMS_AND_CONDITIONS",
    title: "AGB",
  },
  {
    legalType: "WITHDRAWAL_POLICY",
    orderType: "WITHDRAWAL_POLICY",
    title: "Widerrufsbelehrung",
  },
  {
    legalType: "WITHDRAWAL_FORM",
    orderType: "WITHDRAWAL_FORM",
    title: "Muster-Widerrufsformular",
  },
  {
    legalType: "PRIVACY_POLICY",
    orderType: "PRODUCT_SPECIFIC",
    title: "Datenschutzerklärung",
  },
];

async function renderLegalPdf(input: {
  title: string;
  orderNumber: string;
  versionLabel: string | null;
  contentHtml: string;
  checksum: string;
  recordedAt: Date;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margins: { top: 48, bottom: 48, left: 48, right: 48 } });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const plain = input.contentHtml
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim();

    const seller = getInvoiceSellerConfig();
    doc.fontSize(18).text("ALLES WURST", { align: "left" });
    doc.moveDown(0.3);
    doc.fontSize(9).fillColor("#444444");
    doc.text(`${seller.street}, ${seller.postalCode} ${seller.city}`);
    doc.moveDown(0.5);
    doc.fontSize(14).text(input.title, { underline: true });
    doc.moveDown();
    doc.fontSize(9).fillColor("#444444");
    doc.text(`Bestellnummer: ${input.orderNumber}`);
    doc.text(`Version: ${input.versionLabel ?? "—"}`);
    doc.text(`Erstellt: ${input.recordedAt.toLocaleString("de-DE")}`);
    doc.text(`Prüfsumme: ${input.checksum.slice(0, 16)}…`);
    doc.moveDown();
    doc.fillColor("#000000").fontSize(10).text(plain, { align: "left" });
    doc.end();
  });
}

async function renderOrderConfirmationPdf(input: {
  contract: Awaited<ReturnType<typeof buildContractConfirmationView>>;
}): Promise<Buffer> {
  return renderContractConfirmationPdf(input.contract);
}

async function upsertOrderLegalDocument(input: {
  accountingPositionId: string;
  checkoutIntentId: string | null;
  purchaseLegalRecordId: string | null;
  legalDocumentType: OrderLegalDocumentType;
  title: string;
  versionLabel: string | null;
  checksum: string;
  sourceDocumentId?: string | null;
  sourceVersionId?: string | null;
  pdfBuffer: Buffer;
}): Promise<void> {
  const { storageKey } = await saveOrderLegalPdf(
    input.accountingPositionId,
    input.legalDocumentType,
    input.pdfBuffer,
  );

  await prisma.orderLegalDocument.upsert({
    where: {
      accountingPositionId_legalDocumentType: {
        accountingPositionId: input.accountingPositionId,
        legalDocumentType: input.legalDocumentType,
      },
    },
    create: {
      accountingPositionId: input.accountingPositionId,
      checkoutIntentId: input.checkoutIntentId,
      purchaseLegalRecordId: input.purchaseLegalRecordId,
      legalDocumentType: input.legalDocumentType,
      title: input.title,
      versionLabel: input.versionLabel,
      checksum: input.checksum,
      sourceDocumentId: input.sourceDocumentId ?? null,
      sourceVersionId: input.sourceVersionId ?? null,
      storageKey,
      sizeBytes: input.pdfBuffer.length,
      status: "GENERATED",
      generatedAt: new Date(),
    },
    update: {
      storageKey,
      sizeBytes: input.pdfBuffer.length,
      checksum: input.checksum,
      status: "GENERATED",
      generatedAt: new Date(),
      errorMessage: null,
    },
  });
}

export async function generateOrderLegalDocuments(input: {
  checkoutIntentId: string;
  userId: string;
  accountingPositionId: string;
}): Promise<void> {
  const checkout = await prisma.checkoutIntent.findUnique({
    where: { id: input.checkoutIntentId },
    include: {
      productPrice: { include: { product: true } },
      purchaseLegalRecord: true,
      user: {
        select: {
          email: true,
          profile: true,
          membership: { select: { endsAt: true } },
        },
      },
    },
  });

  if (!checkout?.purchaseLegalRecord) {
    return;
  }

  const position = await prisma.accountingPosition.findUnique({
    where: { id: input.accountingPositionId },
    include: { invoice: { select: { invoiceNumber: true } } },
  });

  if (!position) {
    return;
  }

  const orderNumber = formatOrderNumber({
    invoiceNumber: position.invoice?.invoiceNumber,
    positionId: position.id,
  });

  const record = checkout.purchaseLegalRecord;
  const recordedAt = record.recordedAt;

  for (const mapping of DOC_TYPE_MAP) {
    try {
      const published = await getPublishedLegalDocumentByType(mapping.legalType);

      if (!published?.hasPublishedContent) {
        await prisma.orderLegalDocument.upsert({
          where: {
            accountingPositionId_legalDocumentType: {
              accountingPositionId: position.id,
              legalDocumentType: mapping.orderType,
            },
          },
          create: {
            accountingPositionId: position.id,
            checkoutIntentId: checkout.id,
            purchaseLegalRecordId: record.id,
            legalDocumentType: mapping.orderType,
            title: mapping.title,
            versionLabel: published?.versionNumber?.toString() ?? null,
            checksum: published?.checksum ?? "missing",
            status: "FAILED",
            errorMessage: "Keine veröffentlichte Version beim Kauf verfügbar.",
          },
          update: {
            status: "FAILED",
            errorMessage: "Keine veröffentlichte Version beim Kauf verfügbar.",
          },
        });
        continue;
      }

      const checksum =
        mapping.legalType === "TERMS_AND_CONDITIONS"
          ? record.termsChecksum ?? published.checksum ?? ""
          : mapping.legalType === "WITHDRAWAL_POLICY"
            ? record.withdrawalPolicyChecksum ?? published.checksum ?? ""
            : mapping.legalType === "PRIVACY_POLICY"
              ? record.privacyChecksum ?? published.checksum ?? ""
              : published.checksum ?? computeLegalChecksum(published.contentHtml);

      const pdfBuffer = await renderLegalPdf({
        title: mapping.title,
        orderNumber,
        versionLabel: published.versionNumber?.toString() ?? null,
        contentHtml: published.contentHtml,
        checksum,
        recordedAt,
      });

      await upsertOrderLegalDocument({
        accountingPositionId: position.id,
        checkoutIntentId: checkout.id,
        purchaseLegalRecordId: record.id,
        legalDocumentType: mapping.orderType,
        title: mapping.title,
        versionLabel: published.versionNumber?.toString() ?? null,
        checksum,
        pdfBuffer,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "PDF-Erzeugung fehlgeschlagen.";

      await prisma.orderLegalDocument.upsert({
        where: {
          accountingPositionId_legalDocumentType: {
            accountingPositionId: position.id,
            legalDocumentType: mapping.orderType,
          },
        },
        create: {
          accountingPositionId: position.id,
          checkoutIntentId: checkout.id,
          purchaseLegalRecordId: record.id,
          legalDocumentType: mapping.orderType,
          title: mapping.title,
          versionLabel: null,
          checksum: "error",
          status: "FAILED",
          errorMessage: message,
        },
        update: {
          status: "FAILED",
          errorMessage: message,
        },
      });
    }
  }

  try {
    const contract = buildContractConfirmationView({
      orderNumber,
      productName: checkout.productPrice.product.name,
      productSlug: checkout.productPrice.product.slug,
      productKind: checkout.productPrice.product.kind,
      productDescription: checkout.productPrice.product.description,
      billingPeriod: checkout.productPrice.billingPeriod,
      grossAmount: checkout.grossAmount.toNumber(),
      currency: checkout.currency,
      paymentProvider: checkout.paymentProvider,
      paymentStatus: position.paymentStatus,
      paidAt: position.paidAt,
      createdAt: position.createdAt,
      invoiceNumber: position.invoice?.invoiceNumber ?? null,
      immediateAccessConsented: record.immediateAccessConsented,
      withdrawalLossAcknowledged: record.withdrawalLossAcknowledged,
      membershipEndsAt: checkout.user.membership?.endsAt ?? null,
      recordedAt: record.recordedAt,
      consentSnapshot: record.consentSnapshot,
      customerProfile: checkout.user.profile,
      customerEmail: checkout.user.email,
    });

    const confirmationPdf = await renderOrderConfirmationPdf({ contract });

    await upsertOrderLegalDocument({
      accountingPositionId: position.id,
      checkoutIntentId: checkout.id,
      purchaseLegalRecordId: record.id,
      legalDocumentType: "ORDER_CONFIRMATION",
      title: "Vertragsbestätigung",
      versionLabel: recordedAt.toISOString(),
      checksum: computeLegalChecksum(confirmationPdf.toString("base64")),
      pdfBuffer: confirmationPdf,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Vertragsbestätigung fehlgeschlagen.";

    await prisma.orderLegalDocument.upsert({
      where: {
        accountingPositionId_legalDocumentType: {
          accountingPositionId: position.id,
          legalDocumentType: "ORDER_CONFIRMATION",
        },
      },
      create: {
        accountingPositionId: position.id,
        checkoutIntentId: checkout.id,
        purchaseLegalRecordId: record.id,
        legalDocumentType: "ORDER_CONFIRMATION",
        title: "Vertragsbestätigung",
        versionLabel: null,
        checksum: "error",
        status: "FAILED",
        errorMessage: message,
      },
      update: { status: "FAILED", errorMessage: message },
    });
  }
}

export async function retryFailedOrderLegalDocuments(): Promise<number> {
  const failed = await prisma.orderLegalDocument.findMany({
    where: { status: "FAILED" },
    select: {
      accountingPositionId: true,
      checkoutIntentId: true,
      purchaseLegalRecord: { select: { userId: true } },
    },
    distinct: ["accountingPositionId"],
    take: 20,
  });

  let count = 0;

  for (const row of failed) {
    if (!row.checkoutIntentId || !row.purchaseLegalRecord?.userId) {
      continue;
    }

    try {
      await generateOrderLegalDocuments({
        accountingPositionId: row.accountingPositionId,
        checkoutIntentId: row.checkoutIntentId,
        userId: row.purchaseLegalRecord.userId,
      });
      count += 1;
    } catch {
      // Einzelfehler protokollieren, Cron läuft weiter
    }
  }

  return count;
}

export async function getOrderLegalDocumentForDownload(input: {
  userId: string;
  orderId: string;
  documentId: string;
}): Promise<{ buffer: Uint8Array; title: string; mimeType: string } | null> {
  const document = await prisma.orderLegalDocument.findFirst({
    where: {
      id: input.documentId,
      accountingPositionId: input.orderId,
      status: "GENERATED",
      storageKey: { not: null },
    },
    include: {
      purchaseLegalRecord: { select: { userId: true } },
    },
  });

  if (!document) {
    return null;
  }

  const position = await prisma.accountingPosition.findFirst({
    where: { id: input.orderId, userId: input.userId },
  });

  if (!position) {
    return null;
  }

  const buffer = await readOrderLegalPdf(document.storageKey!);

  return {
    buffer,
    title: document.title,
    mimeType: document.mimeType,
  };
}
