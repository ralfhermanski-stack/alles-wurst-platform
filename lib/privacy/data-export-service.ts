/**
 * @file data-export-service.ts
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import PDFDocument from "pdfkit";

import { prisma } from "@/lib/db/prisma";
import { buildAppUrl } from "@/lib/mail/mail-service";
import { sendPlatformEmail } from "@/lib/email/email-service";
import { ensureEmailSystemDefaults } from "@/lib/email/email-bootstrap";

import { createZipArchive } from "./data-export-zip";
import { createDataExportDownloadToken } from "./secure-export-download-token";

const EXPORT_ROOT = path.join(process.cwd(), "storage", "data-exports");
const EXPORT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

type ExportPayload = {
  exportedAt: string;
  account: {
    email: string;
    createdAt: Date;
    profile: unknown;
    membership: unknown;
  };
  orders: Array<{
    productName: string;
    paymentStatus: string;
    grossAmount: string;
    createdAt: Date;
  }>;
  courses: Array<{
    status: string;
    grantedAt: Date;
    expiresAt: Date | null;
  }>;
  tickets: Array<{
    ticketNumber: string;
    subject: string;
    status: string;
    createdAt: Date;
  }>;
  privacyRequests: Array<{
    requestNumber: string;
    type: string;
    status: string;
    createdAt: Date;
  }>;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString("de-DE");
}

function buildExportHtml(payload: ExportPayload): string {
  const orderRows = payload.orders
    .map(
      (order) =>
        `<tr><td>${escapeHtml(order.productName)}</td><td>${escapeHtml(order.paymentStatus)}</td><td>${escapeHtml(order.grossAmount)}</td><td>${formatDate(order.createdAt)}</td></tr>`,
    )
    .join("");

  const courseRows = payload.courses
    .map(
      (course) =>
        `<tr><td>${escapeHtml(course.status)}</td><td>${formatDate(course.grantedAt)}</td><td>${formatDate(course.expiresAt)}</td></tr>`,
    )
    .join("");

  const ticketRows = payload.tickets
    .map(
      (ticket) =>
        `<tr><td>${escapeHtml(ticket.ticketNumber)}</td><td>${escapeHtml(ticket.subject)}</td><td>${escapeHtml(ticket.status)}</td><td>${formatDate(ticket.createdAt)}</td></tr>`,
    )
    .join("");

  const privacyRows = payload.privacyRequests
    .map(
      (request) =>
        `<tr><td>${escapeHtml(request.requestNumber)}</td><td>${escapeHtml(request.type)}</td><td>${escapeHtml(request.status)}</td><td>${formatDate(request.createdAt)}</td></tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>Datenexport — Alles Wurst</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; color: #1a1a1a; }
    h1, h2 { color: #3d2b1f; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0 2rem; }
    th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; font-size: 0.9rem; }
    th { background: #f5f0ea; }
    .meta { color: #666; font-size: 0.9rem; }
  </style>
</head>
<body>
  <h1>Datenexport — Alles Wurst</h1>
  <p class="meta">Erstellt am ${formatDate(payload.exportedAt)}</p>

  <h2>Konto</h2>
  <p><strong>E-Mail:</strong> ${escapeHtml(payload.account.email)}</p>
  <p><strong>Registriert:</strong> ${formatDate(payload.account.createdAt)}</p>

  <h2>Bestellungen</h2>
  <table>
    <thead><tr><th>Produkt</th><th>Status</th><th>Betrag</th><th>Datum</th></tr></thead>
    <tbody>${orderRows || "<tr><td colspan=\"4\">Keine Einträge</td></tr>"}</tbody>
  </table>

  <h2>Kurszugänge</h2>
  <table>
    <thead><tr><th>Status</th><th>Gewährt am</th><th>Läuft ab</th></tr></thead>
    <tbody>${courseRows || "<tr><td colspan=\"3\">Keine Einträge</td></tr>"}</tbody>
  </table>

  <h2>Support-Tickets</h2>
  <table>
    <thead><tr><th>Nummer</th><th>Betreff</th><th>Status</th><th>Datum</th></tr></thead>
    <tbody>${ticketRows || "<tr><td colspan=\"4\">Keine Einträge</td></tr>"}</tbody>
  </table>

  <h2>Datenschutzanfragen</h2>
  <table>
    <thead><tr><th>Nummer</th><th>Typ</th><th>Status</th><th>Datum</th></tr></thead>
    <tbody>${privacyRows || "<tr><td colspan=\"4\">Keine Einträge</td></tr>"}</tbody>
  </table>

  <p class="meta">Vollständige maschinenlesbare Daten liegen in <code>daten.json</code> im ZIP-Archiv.</p>
</body>
</html>`;
}

async function buildExportPdf(payload: ExportPayload): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 48, bottom: 48, left: 48, right: 48 },
    });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Datenexport — Alles Wurst");
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#444444");
    doc.text(`Erstellt: ${formatDate(payload.exportedAt)}`);
    doc.text(`E-Mail: ${payload.account.email}`);
    doc.text(`Registriert: ${formatDate(payload.account.createdAt)}`);
    doc.moveDown();

    doc.fillColor("#000000").fontSize(12).text("Bestellungen", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(9);

    if (payload.orders.length === 0) {
      doc.text("Keine Einträge.");
    } else {
      for (const order of payload.orders.slice(0, 30)) {
        doc.text(
          `• ${order.productName} — ${order.paymentStatus} — ${order.grossAmount} — ${formatDate(order.createdAt)}`,
        );
      }
    }

    doc.moveDown();
    doc.fontSize(12).text("Kurszugänge", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(9);

    if (payload.courses.length === 0) {
      doc.text("Keine Einträge.");
    } else {
      for (const course of payload.courses.slice(0, 30)) {
        doc.text(
          `• ${course.status} — ab ${formatDate(course.grantedAt)} — bis ${formatDate(course.expiresAt)}`,
        );
      }
    }

    doc.moveDown();
    doc.fontSize(12).text("Support-Tickets", { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(9);

    if (payload.tickets.length === 0) {
      doc.text("Keine Einträge.");
    } else {
      for (const ticket of payload.tickets.slice(0, 20)) {
        doc.text(
          `• ${ticket.ticketNumber} — ${ticket.subject} — ${ticket.status}`,
        );
      }
    }

    doc.moveDown();
    doc.fontSize(8).fillColor("#666666");
    doc.text(
      "Vollständige Daten im ZIP-Archiv: daten.json (maschinenlesbar) und uebersicht.html.",
    );
    doc.end();
  });
}

async function collectExportPayload(userId: string): Promise<ExportPayload> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      membership: true,
      accountingPositions: true,
      courseAccess: true,
      supportTicketsCreated: {
        select: {
          ticketNumber: true,
          subject: true,
          status: true,
          createdAt: true,
        },
      },
      privacyRequests: {
        select: {
          requestNumber: true,
          type: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error("Benutzer nicht gefunden.");
  }

  return {
    exportedAt: new Date().toISOString(),
    account: {
      email: user.email,
      createdAt: user.createdAt,
      profile: user.profile,
      membership: user.membership,
    },
    orders: user.accountingPositions.map((position) => ({
      productName: position.productName,
      paymentStatus: position.paymentStatus,
      grossAmount: position.grossAmount.toString(),
      createdAt: position.createdAt,
    })),
    courses: user.courseAccess.map((access) => ({
      status: access.status,
      grantedAt: access.grantedAt ?? access.createdAt,
      expiresAt: access.expiresAt,
    })),
    tickets: user.supportTicketsCreated,
    privacyRequests: user.privacyRequests,
  };
}

export async function processDataExportRequest(exportId: string): Promise<void> {
  const exportRequest = await prisma.dataExportRequest.findUnique({
    where: { id: exportId },
    include: { user: { select: { email: true } } },
  });

  if (!exportRequest) {
    return;
  }

  await prisma.dataExportRequest.update({
    where: { id: exportId },
    data: { status: "PROCESSING" },
  });

  if (exportRequest.privacyRequestId) {
    await prisma.privacyRequest.updateMany({
      where: { id: exportRequest.privacyRequestId },
      data: { status: "UNDER_REVIEW" },
    });
  }

  try {
    const payload = await collectExportPayload(exportRequest.userId);
    const json = JSON.stringify(payload, null, 2);
    const html = buildExportHtml(payload);
    const pdf = await buildExportPdf(payload);

    const zip = createZipArchive([
      { name: "daten.json", data: Buffer.from(json, "utf8") },
      { name: "uebersicht.html", data: Buffer.from(html, "utf8") },
      { name: "uebersicht.pdf", data: pdf },
    ]);

    const storageKey = path.posix.join(
      exportRequest.userId,
      `export-${Date.now()}.zip`,
    );
    const absolutePath = path.join(EXPORT_ROOT, storageKey);

    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, zip);

    const expiresAt = new Date(Date.now() + EXPORT_TTL_MS);

    await prisma.dataExportRequest.update({
      where: { id: exportId },
      data: {
        status: "READY",
        storageKey,
        generatedAt: new Date(),
        expiresAt,
      },
    });

    if (exportRequest.privacyRequestId) {
      await prisma.privacyRequest.update({
        where: { id: exportRequest.privacyRequestId },
        data: { status: "FULFILLED", completedAt: new Date() },
      });
    }

    const downloadToken = createDataExportDownloadToken(
      exportRequest.userId,
      exportId,
    );
    const downloadUrl = buildAppUrl(
      `/api/account/privacy/export/download?token=${encodeURIComponent(downloadToken)}`,
    );

    await ensureEmailSystemDefaults();

    await sendPlatformEmail({
      category: "PRIVACY",
      recipientEmail: exportRequest.user.email,
      recipientUserId: exportRequest.userId,
      templateKey: "privacy.export.ready",
      variables: { documentDownloadUrl: downloadUrl },
      priority: "HIGH",
      relatedEntity: { type: "data_export", id: exportId },
      accountMessage: {
        type: "privacy_export_ready",
        title: "Datenexport bereit",
        body: "Dein Datenexport steht zum Download bereit. Der Link ist 7 Tage gültig.",
        linkUrl: "/account/datenschutz",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Export fehlgeschlagen.";

    await prisma.dataExportRequest.update({
      where: { id: exportId },
      data: { status: "FAILED", errorMessage: message },
    });

    if (exportRequest.privacyRequestId) {
      await prisma.privacyRequest.update({
        where: { id: exportRequest.privacyRequestId },
        data: { status: "REJECTED", rejectionReason: message },
      });
    }
  }
}

export async function getDataExportForDownload(input: {
  userId: string;
  exportId: string;
}): Promise<{ buffer: Buffer; fileName: string } | null> {
  const exportRequest = await prisma.dataExportRequest.findFirst({
    where: {
      id: input.exportId,
      userId: input.userId,
      status: { in: ["READY", "DOWNLOADED"] },
      expiresAt: { gt: new Date() },
      storageKey: { not: null },
    },
  });

  if (!exportRequest?.storageKey) {
    return null;
  }

  const normalized = exportRequest.storageKey.replace(/\\/g, "/");

  if (normalized.includes("..")) {
    return null;
  }

  const { readFile } = await import("node:fs/promises");
  const buffer = await readFile(path.join(EXPORT_ROOT, normalized));

  if (exportRequest.status === "READY") {
    await prisma.dataExportRequest.update({
      where: { id: exportRequest.id },
      data: { status: "DOWNLOADED", downloadedAt: new Date() },
    });
  }

  const stamp = exportRequest.generatedAt
    ? exportRequest.generatedAt.toISOString().slice(0, 10)
    : "export";

  return {
    buffer,
    fileName: `alles-wurst-datenexport-${stamp}.zip`,
  };
}

/** @deprecated Nutze getDataExportForDownload */
export async function readDataExportFile(input: {
  userId: string;
  exportId: string;
}): Promise<Uint8Array | null> {
  const file = await getDataExportForDownload(input);
  return file?.buffer ?? null;
}
