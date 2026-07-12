import {
  adminGuardResponse,
  jsonSuccess,
  parseJsonBody,
} from "@/lib/admin/admin-api-utils";
import {
  getSecuritySettings,
  updateSecuritySettings,
} from "@/lib/security/security-admin-service";
import { writeSecurityAuditLog } from "@/lib/security/security-audit-service";
import { assertAdminAccessFromRequest } from "@/lib/admin/admin-auth";
import { jsonFromAuthResult } from "@/lib/auth/auth-api-utils";
import { getClientIpFromRequest } from "@/lib/security/client-ip";

export async function GET(request: Request) {
  const guard = await adminGuardResponse(request);

  if (guard) {
    return guard;
  }

  const settings = await getSecuritySettings();
  return jsonSuccess(settings);
}

export async function PUT(request: Request) {
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

  const updated = await updateSecuritySettings({
    loginFailThresholdThrottle: Number(body.loginFailThresholdThrottle),
    loginFailThresholdCaptcha: Number(body.loginFailThresholdCaptcha),
    loginFailThreshold30m: Number(body.loginFailThreshold30m),
    loginFailThreshold24h: Number(body.loginFailThreshold24h),
    loginRateLimitPerIp: Number(body.loginRateLimitPerIp),
    registerRateLimitPerIp: Number(body.registerRateLimitPerIp),
    passwordResetRateLimitPerIp: Number(body.passwordResetRateLimitPerIp),
    apiRateLimitPerIp: Number(body.apiRateLimitPerIp),
    retentionLoginAttemptsDays: Number(body.retentionLoginAttemptsDays),
    retentionSecurityEventsDays: Number(body.retentionSecurityEventsDays),
    retentionBlockedIpsDays: Number(body.retentionBlockedIpsDays),
    retentionAuditLogDays: Number(body.retentionAuditLogDays),
  });

  await writeSecurityAuditLog({
    action: "SECURITY_RULE_CHANGE",
    actorUserId: access.data.userId,
    ipAddress: getClientIpFromRequest(request),
    description: "Sicherheitsregeln aktualisiert",
    metadata: { updatedFields: Object.keys(body) },
  });

  return jsonSuccess(updated);
}
