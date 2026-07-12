import {
  adminGuardResponse,
  getStringField,
  jsonSuccess,
  parseJsonBody,
} from "@/lib/admin/admin-api-utils";
import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import {
  blockIpManually,
  listBlockedIps,
  unblockIp,
} from "@/lib/security/security-admin-service";
import type { IpBlockLevel } from "@prisma/client";

export async function GET(request: Request) {
  const guard = await adminGuardResponse(request);

  if (guard) {
    return guard;
  }

  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "1");
  const data = await listBlockedIps({ activeOnly: true, page });

  return jsonSuccess(data);
}

export async function POST(request: Request) {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const body = await parseJsonBody(request);

  if (!body) {
    return Response.json(
      { success: false, error: { message: "Ungültiger Body." } },
      { status: 400 },
    );
  }

  const ipAddress = getStringField(body, "ipAddress");
  const level = getStringField(body, "level") as IpBlockLevel | null;
  const reason = getStringField(body, "reason");
  const notes = getStringField(body, "notes");
  const permanent = Boolean(body.permanent);

  if (!ipAddress || !level) {
    return Response.json(
      { success: false, error: { message: "IP-Adresse und Sperrstufe erforderlich." } },
      { status: 400 },
    );
  }

  await blockIpManually({
    ipAddress,
    level,
    reason: reason ?? undefined,
    notes: notes ?? undefined,
    createdByUserId: access.data.userId,
    permanent,
  });

  return jsonSuccess(true);
}

export async function DELETE(request: Request) {
  const access = await assertAdminAccessFromRequest(request);

  if (!access.success) {
    return jsonFromAuthResult(access);
  }

  const body = await parseJsonBody(request);
  const ipAddress = body ? getStringField(body, "ipAddress") : null;
  const notes = body ? getStringField(body, "notes") : null;

  if (!ipAddress) {
    return Response.json(
      { success: false, error: { message: "IP-Adresse erforderlich." } },
      { status: 400 },
    );
  }

  await unblockIp(ipAddress, access.data.userId, notes ?? undefined);

  return jsonSuccess(true);
}
