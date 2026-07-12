/**
 * @file purchase-evidence.ts
 * @purpose DSGVO-konforme Nachweisdaten für Vertragsabschlüsse (gehasht).
 */

import { hashIpAddress, hashUserAgent } from "@/lib/analytics/analytics-privacy";
import { getClientIpFromRequest } from "@/lib/security/client-ip";

export type PurchaseEvidenceInput = {
  request: Request;
};

export type PurchaseEvidence = {
  clientIpHash: string | null;
  userAgentHash: string | null;
  recordedAt: Date;
};

export function collectPurchaseEvidence(input: PurchaseEvidenceInput): PurchaseEvidence {
  const ip = getClientIpFromRequest(input.request);
  const userAgent = input.request.headers.get("user-agent");

  return {
    clientIpHash: hashIpAddress(ip),
    userAgentHash: hashUserAgent(userAgent),
    recordedAt: new Date(),
  };
}
