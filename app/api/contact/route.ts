/**
 * @file app/api/contact/route.ts
 * @purpose Öffentliche API: Kontaktformular absenden.
 */

import { submitContactForm } from "@/lib/contact/contact-service";
import {
  getStringField,
  parseJsonBody,
} from "@/lib/tools/recipe-api-utils";

export async function POST(request: Request): Promise<Response> {
  const body = await parseJsonBody(request);

  if (!body) {
    return Response.json(
      {
        success: false,
        message: "Ungültige Anfrage.",
      },
      { status: 400 },
    );
  }

  // Honeypot gegen einfache Bots
  const honeypot = getStringField(body, "website")?.trim();
  if (honeypot) {
    return Response.json({
      success: true,
      message:
        "Deine Nachricht wurde gesendet. Du erhältst in Kürze eine Bestätigung per E-Mail.",
    });
  }

  const result = await submitContactForm({
    name: getStringField(body, "name") ?? "",
    email: getStringField(body, "email") ?? "",
    subject: getStringField(body, "subject") ?? "",
    message: getStringField(body, "message") ?? "",
  });

  return Response.json(result, {
    status: result.success ? 200 : 400,
  });
}
