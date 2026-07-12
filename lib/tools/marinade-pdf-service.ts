/**
 * @file marinade-pdf-service.ts
 * @purpose Serverseitige PDF-Erzeugung für Marinaden-Rezepte.
 */

import PDFDocument from "pdfkit";
import QRCode from "qrcode";

import {
  INTENSITY_LABELS,
  MARINADE_STYLE_LABELS,
  PREPARATION_LABELS,
  PRODUCT_TYPE_LABELS,
} from "./marinade-labels";
import { calculateMarinade } from "./marinade-calculator";
import type { MarinadeRecipePayload } from "./marinade-types";
import {
  deleteMarinadePdf,
  readMarinadePdf,
  saveMarinadePdf,
} from "./marinade-pdf-storage";

export type MarinadePdfInput = {
  recipeId: string;
  recipeName: string;
  creatorName: string;
  payload: MarinadeRecipePayload;
  version: number;
};

const BRAND_GOLD = "#8b6914";
const BRAND_DARK = "#1a1410";
const BRAND_MUTED = "#6b6560";

function formatGrams(value: number, unit: "g" | "ml"): string {
  const formatted = new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: 1,
  }).format(value);

  return `${formatted} ${unit}`;
}

function formatKg(value: number): string {
  return `${new Intl.NumberFormat("de-DE", { maximumFractionDigits: 3 }).format(value)} kg`;
}

async function renderPdfBuffer(input: MarinadePdfInput): Promise<Buffer> {
  const calculation = calculateMarinade(input.payload);
  const qrDataUrl = await QRCode.toDataURL(
    `https://alles-wurst.de/werkstatt/marinaden-generator/${input.recipeId}`,
    { margin: 1, width: 96 },
  );
  const qrBase64 = qrDataUrl.replace(/^data:image\/png;base64,/, "");
  const qrBuffer = Buffer.from(qrBase64, "base64");

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 48, bottom: 56, left: 48, right: 48 },
      info: {
        Title: input.recipeName,
        Author: input.creatorName,
        Subject: "Marinaden-Rezept — Alles Wurst",
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Header
    doc
      .fillColor(BRAND_DARK)
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("Alles Wurst", { align: "left" });
    doc
      .fillColor(BRAND_GOLD)
      .fontSize(11)
      .font("Helvetica")
      .text("Marinaden-Rezept", { align: "left" });
    doc.moveDown(0.5);
    doc
      .strokeColor(BRAND_GOLD)
      .lineWidth(2)
      .moveTo(doc.page.margins.left, doc.y)
      .lineTo(doc.page.margins.left + pageWidth, doc.y)
      .stroke();
    doc.moveDown(1);

    // Titel
    doc
      .fillColor(BRAND_DARK)
      .fontSize(18)
      .font("Helvetica-Bold")
      .text(input.recipeName);
    doc.moveDown(0.5);

    const metaRows: [string, string][] = [
      ["Marinadenart", MARINADE_STYLE_LABELS[input.payload.marinadeStyle]],
      ["Geeignet für", PRODUCT_TYPE_LABELS[input.payload.productType]],
      ["Produkt", input.payload.productName],
      ["Gesamtgewicht", formatKg(calculation.totalWeightKg)],
      ["Intensität", INTENSITY_LABELS[input.payload.intensity]],
      ["Ziehzeit", input.payload.marinationTime],
      ["Zubereitung", PREPARATION_LABELS[input.payload.preparationMethod]],
      ["Erstellt von", input.creatorName],
      [
        "Datum",
        new Intl.DateTimeFormat("de-DE", {
          dateStyle: "long",
          timeStyle: "short",
        }).format(new Date()),
      ],
      ["Rezept-ID", input.recipeId],
    ];

    doc.fontSize(10).font("Helvetica");
    for (const [label, value] of metaRows) {
      doc.fillColor(BRAND_MUTED).text(`${label}: `, { continued: true });
      doc.fillColor(BRAND_DARK).text(value);
    }

    doc.moveDown(1);
    doc
      .fillColor(BRAND_GOLD)
      .fontSize(13)
      .font("Helvetica-Bold")
      .text("Zutaten");
    doc.moveDown(0.3);

    // Tabelle
    const col1 = doc.page.margins.left;
    const col2 = col1 + pageWidth * 0.42;
    const col3 = col1 + pageWidth * 0.62;
    const col4 = col1 + pageWidth * 0.78;
    const rowHeight = 18;

    doc
      .fillColor("#f5f0e8")
      .rect(col1, doc.y, pageWidth, rowHeight)
      .fill();
    const tableTop = doc.y;

    doc
      .fillColor(BRAND_DARK)
      .fontSize(9)
      .font("Helvetica-Bold")
      .text("Zutat", col1 + 4, tableTop + 5, { width: col2 - col1 - 8 })
      .text("je kg", col2 + 4, tableTop + 5, { width: col3 - col2 - 8 })
      .text("Gesamt", col3 + 4, tableTop + 5, { width: col4 - col3 - 8 })
      .text("%", col4 + 4, tableTop + 5, { width: pageWidth - (col4 - col1) - 8 });

    let y = tableTop + rowHeight;

    for (const row of calculation.ingredients) {
      if (y > doc.page.height - doc.page.margins.bottom - 80) {
        doc.addPage();
        y = doc.page.margins.top;
      }

      const isEven = calculation.ingredients.indexOf(row) % 2 === 0;
      if (isEven) {
        doc.fillColor("#faf8f5").rect(col1, y, pageWidth, rowHeight).fill();
      }

      doc
        .fillColor(BRAND_DARK)
        .fontSize(9)
        .font("Helvetica")
        .text(row.name, col1 + 4, y + 5, { width: col2 - col1 - 8 })
        .text(
          formatGrams(row.amountPerKg, row.unit),
          col2 + 4,
          y + 5,
          { width: col3 - col2 - 8 },
        )
        .text(
          formatGrams(row.totalAmount, row.unit),
          col3 + 4,
          y + 5,
          { width: col4 - col3 - 8 },
        )
        .text(
          `${row.percentOfTotal} %`,
          col4 + 4,
          y + 5,
          { width: pageWidth - (col4 - col1) - 8 },
        );

      y += rowHeight;
    }

    doc.y = y + 12;

    // Herstellung
    doc
      .fillColor(BRAND_GOLD)
      .fontSize(13)
      .font("Helvetica-Bold")
      .text("Herstellung");
    doc.moveDown(0.3);
    doc.fillColor(BRAND_DARK).fontSize(10).font("Helvetica");

    for (const step of input.payload.steps.slice().sort((a, b) => a.sortOrder - b.sortOrder)) {
      doc.font("Helvetica-Bold").text(`${step.sortOrder}. ${step.title}`);
      if (step.description) {
        doc.font("Helvetica").fillColor(BRAND_MUTED).text(step.description);
      }
      doc.moveDown(0.3);
    }

    // Hinweise
    const hintSections: [string, string | undefined][] = [
      ["Verarbeitung", input.payload.hints.processing],
      ["Haltbarkeit", input.payload.hints.storage],
      ["Hygiene", input.payload.hints.hygiene],
      ["Notizen", input.payload.notes],
    ];

    const hasHints = hintSections.some(([, value]) => value?.trim());

    if (hasHints || input.payload.warnings.length > 0) {
      doc.moveDown(0.5);
      doc.fillColor(BRAND_GOLD).fontSize(13).font("Helvetica-Bold").text("Hinweise");
      doc.moveDown(0.3);
      doc.fillColor(BRAND_DARK).fontSize(10).font("Helvetica");

      for (const [title, text] of hintSections) {
        if (text?.trim()) {
          doc.font("Helvetica-Bold").text(title);
          doc.font("Helvetica").text(text);
          doc.moveDown(0.2);
        }
      }

      if (input.payload.warnings.length > 0) {
        doc.font("Helvetica-Bold").text("Warnhinweise");
        for (const warning of input.payload.warnings) {
          doc.font("Helvetica").fillColor("#8b4513").text(`• ${warning}`);
        }
        doc.fillColor(BRAND_DARK);
      }
    }

    if (input.payload.allergens.length > 0) {
      doc.moveDown(0.3);
      doc.font("Helvetica-Bold").text("Allergene");
      doc.font("Helvetica").text(input.payload.allergens.join(", "));
    }

    // QR-Code
    const qrX = doc.page.width - doc.page.margins.right - 96;
    const qrY = doc.page.height - doc.page.margins.bottom - 96;
    doc.image(qrBuffer, qrX, qrY, { width: 80, height: 80 });

    // Footer
    doc
      .fillColor(BRAND_MUTED)
      .fontSize(8)
      .text(
        `alles-wurst.de · Version ${input.version} · Marinaden-Generator`,
        doc.page.margins.left,
        doc.page.height - doc.page.margins.bottom + 16,
        { align: "center", width: pageWidth },
      );

    doc.end();
  });
}

/**
 * Erzeugt ein PDF und speichert es serverseitig.
 */
export async function generateAndStoreMarinadePdf(
  input: MarinadePdfInput,
  previousStorageKey?: string | null,
): Promise<{ storageKey: string; generatedAt: Date }> {
  const buffer = await renderPdfBuffer(input);
  const { storageKey } = await saveMarinadePdf(input.recipeId, buffer);

  if (previousStorageKey && previousStorageKey !== storageKey) {
    await deleteMarinadePdf(previousStorageKey);
  }

  return { storageKey, generatedAt: new Date() };
}

/**
 * Liest ein gespeichertes PDF für den geschützten Download.
 */
export async function loadMarinadePdfBytes(
  storageKey: string,
): Promise<Uint8Array> {
  return readMarinadePdf(storageKey);
}
