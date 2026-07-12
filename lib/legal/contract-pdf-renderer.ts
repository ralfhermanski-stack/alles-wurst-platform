/**
 * @file contract-pdf-renderer.ts
 * @purpose Hochwertige Vertragsbestätigung als PDF (Briefkopf, Seitenzahlen).
 */

import fs from "node:fs";
import path from "node:path";

import PDFDocument from "pdfkit";

import type { ContractConfirmationView } from "./contract-confirmation-service";

type PdfDoc = InstanceType<typeof PDFDocument>;

const PAGE_MARGIN = 56;
const FOOTER_HEIGHT = 36;

function tryLoadLogoPath(): string | null {
  const candidates = [
    path.join(process.cwd(), "public", "logo-horizontal.png"),
    path.join(process.cwd(), "public", "logo-stacked.png"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function drawPageFooter(doc: PdfDoc, pageNumber: number) {
  const bottom = doc.page.height - PAGE_MARGIN + 12;
  doc
    .fontSize(8)
    .fillColor("#666666")
    .text(
      `ALLES WURST — Vertragsbestätigung — Seite ${pageNumber}`,
      PAGE_MARGIN,
      bottom,
      {
        align: "center",
        width: doc.page.width - PAGE_MARGIN * 2,
      },
    );
}

function ensureSpace(
  doc: PdfDoc,
  needed: number,
  pageNumber: { current: number },
) {
  const usableBottom = doc.page.height - PAGE_MARGIN - FOOTER_HEIGHT;

  if (doc.y + needed > usableBottom) {
    drawPageFooter(doc, pageNumber.current);
    doc.addPage();
    pageNumber.current += 1;
    doc.y = PAGE_MARGIN;
  }
}

function sectionHeading(
  doc: PdfDoc,
  title: string,
  pageNumber: { current: number },
) {
  ensureSpace(doc, 40, pageNumber);
  doc.moveDown(0.5);
  doc.fontSize(12).fillColor("#1a1a1a").text(title, { underline: true });
  doc.moveDown(0.4);
  doc.fontSize(10).fillColor("#222222");
}

export async function renderContractConfirmationPdf(
  contract: ContractConfirmationView,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: {
        top: PAGE_MARGIN,
        bottom: PAGE_MARGIN + FOOTER_HEIGHT,
        left: PAGE_MARGIN,
        right: PAGE_MARGIN,
      },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    const pageNumber = { current: 1 };

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const logoPath = tryLoadLogoPath();

    if (logoPath) {
      doc.image(logoPath, PAGE_MARGIN, PAGE_MARGIN - 8, { width: 140 });
      doc.y = PAGE_MARGIN + 52;
    } else {
      doc.fontSize(20).fillColor("#8B4513").text("ALLES WURST");
      doc.moveDown(0.3);
    }

    doc
      .fontSize(9)
      .fillColor("#444444")
      .text(contract.provider.lines.join(" · "));
    doc.moveDown(1);

    doc.fontSize(16).fillColor("#1a1a1a").text("Vertragsbestätigung", {
      align: "center",
    });
    doc.moveDown(0.3);
    doc.fontSize(10).text("Vielen Dank für Ihr Vertrauen.", { align: "center" });
    doc.text("Wir freuen uns, Sie bei ALLES WURST begrüßen zu dürfen.", {
      align: "center",
    });
    doc.moveDown(0.5);
    doc.fontSize(9).fillColor("#666666").text(`Vertragsnummer ${contract.contractNumber}`, {
      align: "center",
    });
    doc.moveDown(1);

    sectionHeading(doc, "Vertragspartner", pageNumber);

    doc.text("Anbieter:", { continued: false });
    doc.text("ALLES WURST");
    doc.text("Ralf Hermanski, Fleischermeister");
    contract.provider.lines.forEach((line) => doc.text(line));
    if (contract.provider.email) {
      doc.text(contract.provider.email);
    }

    doc.moveDown(0.6);
    doc.text("Vertragspartner:");
    doc.text(contract.customer.name);
    contract.customer.lines.forEach((line) => doc.text(line));
    doc.text(contract.customer.email ?? "");

    sectionHeading(doc, "Vertragsgegenstand", pageNumber);
    doc.text(`Produkt: ${contract.productName}`);
    if (contract.membershipLabel) {
      doc.text(`Mitgliedschaft: ${contract.membershipLabel}`);
    }
    doc.text(
      `Leistungsbeschreibung: ${contract.productDescription ?? contract.productName}`,
    );
    doc.text(`Vertragsbeginn: ${contract.contractStart}`);
    doc.text(`Laufzeit: ${contract.contractDuration}`);
    doc.text(`Verlängerungsbedingungen: ${contract.renewalConditions}`);
    doc.text(`Preis: ${contract.priceLabel}`);

    sectionHeading(doc, "Leistungsumfang", pageNumber);
    contract.benefits.forEach((benefit) => doc.text(`• ${benefit}`));

    sectionHeading(doc, "Zahlungsinformationen", pageNumber);
    doc.text(`Bestellnummer: ${contract.payment.orderNumber}`);
    doc.text(`Kaufdatum: ${contract.payment.purchaseDate}`);
    doc.text(`Zahlungsart: ${contract.payment.paymentMethod}`);
    doc.text(`Zahlungsstatus: ${contract.payment.paymentStatus}`);
    if (contract.payment.invoiceNumber) {
      doc.text(`Rechnungsnummer: ${contract.payment.invoiceNumber}`);
    }

    sectionHeading(doc, "Widerrufsinformationen", pageNumber);
    const bothConfirmed =
      contract.withdrawal.immediateAccessConsented &&
      contract.withdrawal.withdrawalLossAcknowledged;

    doc.text(
      `${bothConfirmed ? "✔" : "✖"} ${
        contract.withdrawal.immediateAccessConsented
          ? "Sofortige Bereitstellung wurde ausdrücklich gewünscht."
          : "Sofortige Bereitstellung wurde nicht bestätigt."
      }`,
    );
    doc.text(
      `${bothConfirmed ? "✔" : "✖"} ${
        contract.withdrawal.withdrawalLossAcknowledged
          ? "Kenntnis über einen möglichen Verlust des Widerrufsrechts wurde bestätigt."
          : "Kenntnis über einen möglichen Verlust des Widerrufsrechts wurde nicht bestätigt."
      }`,
    );
    if (contract.withdrawal.notice) {
      doc.moveDown(0.3);
      doc.text(contract.withdrawal.notice);
    }

    sectionHeading(doc, "Schluss", pageNumber);
    doc.text(
      "Wir wünschen Ihnen viel Freude und Erfolg mit Ihrer Mitgliedschaft bei ALLES WURST.",
    );
    doc.moveDown(0.8);
    doc.text("Mit freundlichen Grüßen");
    doc.text("Ralf Hermanski");
    doc.text("Fleischermeister");
    doc.text("ALLES WURST");

    drawPageFooter(doc, pageNumber.current);
    doc.end();
  });
}
