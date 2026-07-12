/**
 * @file email-bootstrap.ts
 * @purpose Standard-Provider, Absender, Kategorien und Systemvorlagen.
 */

import { prisma } from "@/lib/db/prisma";
import { actionButtonHtml } from "./email-layout";

import type { EmailCategory, EmailProviderType } from "@prisma/client";

const DEFAULT_CATEGORIES: EmailCategory[] = [
  "AUTH",
  "ACCOUNT",
  "SUPPORT",
  "TICKET",
  "COURSE",
  "CERTIFICATE",
  "ORDER",
  "PAYMENT",
  "BILLING",
  "MEMBERSHIP",
  "WITHDRAWAL",
  "PRIVACY",
  "CHALLENGE",
  "COMMUNITY",
  "MASTER_SUPPORT",
  "NEWSLETTER",
  "SECURITY",
  "SYSTEM",
  "ADMIN_MANUAL",
];

const TEMPLATE_SEEDS: Array<{
  key: string;
  name: string;
  category: EmailCategory;
  subject: string;
  htmlContent: string;
  textContent: string;
  allowedVariables: string[];
}> = [
  {
    key: "auth.verify",
    name: "E-Mail-Verifikation",
    category: "AUTH",
    subject: "E-Mail-Adresse bestätigen — Alles Wurst",
    htmlContent: `<p>Hallo {{firstName}},</p><p>bitte bestätige deine E-Mail-Adresse.</p>${actionButtonHtml("E-Mail bestätigen", "{{verificationUrl}}")}`,
    textContent:
      "Hallo {{firstName}},\n\nbitte bestätige deine E-Mail-Adresse:\n{{verificationUrl}}\n",
    allowedVariables: ["firstName", "verificationUrl"],
  },
  {
    key: "auth.reset",
    name: "Passwort zurücksetzen",
    category: "AUTH",
    subject: "Passwort zurücksetzen — Alles Wurst",
    htmlContent: `<p>Hallo {{firstName}},</p><p>du hast ein neues Passwort angefordert.</p>${actionButtonHtml("Passwort zurücksetzen", "{{resetUrl}}")}`,
    textContent:
      "Hallo {{firstName}},\n\nPasswort zurücksetzen:\n{{resetUrl}}\n",
    allowedVariables: ["firstName", "resetUrl"],
  },
  {
    key: "order.purchase",
    name: "Kaufbestätigung",
    category: "ORDER",
    subject: "Kaufbestätigung — {{productName}}",
    htmlContent:
      "<p>Hallo {{firstName}},</p><p>vielen Dank für deine Bestellung <strong>{{orderNumber}}</strong> ({{amount}}).</p>",
    textContent:
      "Hallo {{firstName}},\n\nvielen Dank für deine Bestellung {{orderNumber}} ({{amount}}).\n",
    allowedVariables: ["firstName", "orderNumber", "productName", "amount"],
  },
  {
    key: "privacy.export.confirm",
    name: "Datenexport bestätigen",
    category: "PRIVACY",
    subject: "Bestätige deinen Datenexport",
    htmlContent: `<p>Du hast einen Datenexport angefordert.</p>${actionButtonHtml("Export bestätigen", "{{actionUrl}}")}`,
    textContent: "Datenexport bestätigen: {{actionUrl}}\n",
    allowedVariables: ["actionUrl", "firstName"],
  },
  {
    key: "privacy.export.ready",
    name: "Datenexport bereit",
    category: "PRIVACY",
    subject: "Dein Datenexport ist bereit",
    htmlContent: `<p>Dein Datenexport steht zum Download bereit.</p>${actionButtonHtml("ZIP herunterladen", "{{documentDownloadUrl}}")}`,
    textContent: "Download: {{documentDownloadUrl}}\n",
    allowedVariables: ["documentDownloadUrl", "firstName"],
  },
  {
    key: "privacy.deletion.confirm",
    name: "Kontolöschung bestätigen",
    category: "PRIVACY",
    subject: "Bestätige deine Kontolöschanfrage",
    htmlContent: `<p>Du hast die Löschung deines Kontos beantragt.</p>${actionButtonHtml("Löschanfrage bestätigen", "{{actionUrl}}")}`,
    textContent: "Löschanfrage bestätigen: {{actionUrl}}\n",
    allowedVariables: ["actionUrl", "firstName"],
  },
  {
    key: "withdrawal.received",
    name: "Widerruf eingegangen",
    category: "WITHDRAWAL",
    subject: "Widerruf eingegangen — {{withdrawalNumber}}",
    htmlContent:
      "<p>Dein Widerruf <strong>{{withdrawalNumber}}</strong> zu Bestellung {{orderNumber}} ist eingegangen.</p>",
    textContent:
      "Widerruf {{withdrawalNumber}} zu Bestellung {{orderNumber}} eingegangen.\n",
    allowedVariables: ["withdrawalNumber", "orderNumber", "firstName"],
  },
  {
    key: "ticket.reply",
    name: "Ticketantwort",
    category: "TICKET",
    subject: "Antwort zu Ticket {{ticketNumber}}",
    htmlContent:
      "<p>Es gibt eine neue Antwort zu deinem Support-Ticket <strong>{{ticketNumber}}</strong>.</p><p>{{bodyHtml}}</p>",
    textContent: "Neue Antwort zu Ticket {{ticketNumber}}.\n",
    allowedVariables: ["ticketNumber", "bodyHtml", "supportUrl", "firstName"],
  },
  {
    key: "membership.renewal.notice",
    name: "Mitgliedschaft — Verlängerungshinweis",
    category: "MEMBERSHIP",
    subject: "Deine {{roleLabel}}-Mitgliedschaft verlängert sich am {{renewalDate}}",
    htmlContent: `<p>Hallo {{firstName}},</p><p>deine <strong>{{roleLabel}}</strong>-Mitgliedschaft ({{periodLabel}}) verlängert sich automatisch am <strong>{{renewalDate}}</strong>.</p><p>Du musst nichts tun, wenn du die Mitgliedschaft behalten möchtest.</p>${actionButtonHtml("Mitgliedschaft verwalten", "{{manageUrl}}")}`,
    textContent:
      "Hallo {{firstName}},\n\ndeine {{roleLabel}}-Mitgliedschaft ({{periodLabel}}) verlängert sich automatisch am {{renewalDate}}.\n\n{{manageUrl}}\n",
    allowedVariables: [
      "firstName",
      "roleLabel",
      "periodLabel",
      "renewalDate",
      "manageUrl",
      "leadDays",
    ],
  },
  {
    key: "membership.cancel.confirm",
    name: "Mitgliedschaft — Kündigungsbestätigung",
    category: "MEMBERSHIP",
    subject: "Kündigung bestätigt — Zugang bis {{periodEndLabel}}",
    htmlContent: `<p>Hallo {{firstName}},</p><p>deine <strong>{{roleLabel}}</strong>-Mitgliedschaft endet am <strong>{{periodEndLabel}}</strong>. Bis dahin behältst du deinen Zugang.</p>${actionButtonHtml("Mitgliedschaft verwalten", "{{manageUrl}}")}`,
    textContent:
      "Hallo {{firstName}},\n\nKündigung bestätigt. Zugang bis {{periodEndLabel}}.\n\n{{manageUrl}}\n",
    allowedVariables: ["firstName", "roleLabel", "periodEndLabel", "manageUrl"],
  },
];

let bootstrapPromise: Promise<number> | null = null;

function resolveBootstrapProviderType(): EmailProviderType {
  const configured = process.env.MAIL_PROVIDER?.trim().toLowerCase();

  if (configured === "smtp") return "SMTP";
  if (configured === "resend") return "RESEND";
  if (configured === "brevo") return "BREVO";
  if (process.env.NODE_ENV === "development") return "DEV";
  return "DISABLED";
}

export async function ensureEmailSystemDefaults(): Promise<number> {
  if (bootstrapPromise) {
    return bootstrapPromise;
  }

  bootstrapPromise = runEmailBootstrap();
  return bootstrapPromise;
}

async function runEmailBootstrap(): Promise<number> {
  let created = 0;

  let provider = await prisma.emailProviderConfig.findFirst({
    where: { active: true },
  });

  if (!provider) {
    provider = await prisma.emailProviderConfig.create({
      data: {
        providerType: resolveBootstrapProviderType(),
        name: "Standard-Provider",
        active: true,
        settings: {
          host: process.env.SMTP_HOST ?? null,
          port: process.env.SMTP_PORT ?? "587",
          secure: process.env.SMTP_SECURE ?? "false",
          user: process.env.SMTP_USER ?? null,
        },
      },
    });
    created += 1;
  }

  let sender = await prisma.emailSenderIdentity.findFirst({
    where: { defaultSender: true },
  });

  if (!sender) {
    const from = process.env.MAIL_FROM?.trim() || "noreply@localhost";
    sender = await prisma.emailSenderIdentity.create({
      data: {
        providerConfigId: provider.id,
        internalName: "system-default",
        displayName: process.env.MAIL_FROM_NAME?.trim() || "Alles Wurst",
        emailAddress: from,
        replyToAddress: process.env.MAIL_REPLY_TO?.trim() || from,
        active: true,
        verified: true,
        defaultSender: true,
        allowedCategories: DEFAULT_CATEGORIES,
        sortOrder: 0,
      },
    });
    created += 1;
  }

  for (const category of DEFAULT_CATEGORIES) {
    const existing = await prisma.emailCategoryConfig.findUnique({
      where: { category },
    });

    if (!existing) {
      await prisma.emailCategoryConfig.create({
        data: {
          category,
          defaultSenderId: sender.id,
          defaultPriority:
            category === "AUTH" || category === "SECURITY"
              ? "CRITICAL"
              : category === "ORDER" ||
                  category === "WITHDRAWAL" ||
                  category === "PRIVACY"
                ? "HIGH"
                : category === "NEWSLETTER"
                  ? "BULK"
                  : "NORMAL",
          transactional: category !== "NEWSLETTER" && category !== "CHALLENGE",
          marketing: category === "NEWSLETTER" || category === "COMMUNITY",
          attachmentsAllowed:
            category === "ORDER" ||
            category === "BILLING" ||
            category === "PRIVACY" ||
            category === "CERTIFICATE",
          alsoAccountMessage:
            category === "PRIVACY" ||
            category === "WITHDRAWAL" ||
            category === "TICKET",
          manualSendRoles:
            category === "TICKET" || category === "SUPPORT"
              ? ["ADMIN", "SUPPORT"]
              : category === "BILLING" || category === "ORDER"
                ? ["ADMIN"]
                : ["ADMIN"],
        },
      });
      created += 1;
    }
  }

  for (const seed of TEMPLATE_SEEDS) {
    const existing = await prisma.emailTemplate.findUnique({
      where: { key: seed.key },
    });

    if (existing) {
      continue;
    }

    const template = await prisma.emailTemplate.create({
      data: {
        key: seed.key,
        name: seed.name,
        category: seed.category,
        status: "ACTIVE",
      },
    });

    const version = await prisma.emailTemplateVersion.create({
      data: {
        templateId: template.id,
        version: 1,
        subject: seed.subject,
        htmlContent: seed.htmlContent,
        textContent: seed.textContent,
        allowedVariables: seed.allowedVariables,
        status: "ACTIVE",
        publishedAt: new Date(),
      },
    });

    await prisma.emailTemplate.update({
      where: { id: template.id },
      data: { activeVersionId: version.id, status: "ACTIVE" },
    });

    created += 1;
  }

  return created;
}
