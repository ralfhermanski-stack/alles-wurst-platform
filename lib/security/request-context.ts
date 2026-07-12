/**
 * @file request-context.ts
 * @purpose Sicherheitskontext aus HTTP-Request extrahieren.
 */

import { getClientIpFromRequest, getCloudflareGeoFromRequest } from "./client-ip";
import type { SecurityRequestContext } from "./security-types";
import { parseUserAgent } from "./user-agent-parser";

export function buildSecurityRequestContext(request: Request): SecurityRequestContext {
  const userAgent = request.headers.get("user-agent");
  const parsed = parseUserAgent(userAgent);
  const geo = getCloudflareGeoFromRequest(request);
  const url = new URL(request.url);

  return {
    ipAddress: getClientIpFromRequest(request),
    userAgent,
    browser: parsed.browser,
    os: parsed.os,
    countryCode: geo.countryCode,
    region: geo.region,
    asn: geo.asn,
    provider: geo.provider,
    path: url.pathname,
    method: request.method,
  };
}
