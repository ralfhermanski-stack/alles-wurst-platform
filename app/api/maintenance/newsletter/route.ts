import { NextResponse } from "next/server";

import { subscribeMaintenanceNewsletter } from "@/lib/maintenance/maintenance-service";

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as { email?: unknown };
    const email = typeof body.email === "string" ? body.email : "";

    await subscribeMaintenanceNewsletter(email);

    return NextResponse.json({
      success: true,
      message: "Vielen Dank! Wir informieren Sie, sobald die Plattform wieder online ist.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Anmeldung konnte nicht gespeichert werden.",
      },
      { status: 400 },
    );
  }
}
