/**
 * @file security-headers.ts
 * @purpose Security-Header für Next.js und Middleware.
 */

import { legalProviderFrameSrcCsp } from "@/lib/legal/legal-provider-hosts";

export function getSecurityHeaders(isProduction: boolean): Record<string, string> {
  const legalFrameSrc = legalProviderFrameSrcCsp();

  const headers: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-Frame-Options": "SAMEORIGIN",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), payment=(self), usb=()",
    "X-DNS-Prefetch-Control": "off",
  };

  if (isProduction) {
    headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload";
  }

  headers["Content-Security-Policy"] = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com https://*.stripe.com https://player.vimeo.com https://*.vimeo.com https://*.vimeocdn.com",
    `frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://player.vimeo.com https://vimeo.com ${legalFrameSrc}`,
    "media-src 'self' blob: https://*.vimeocdn.com https://player.vimeo.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join("; ");

  return headers;
}

export function applySecurityHeaders(response: Response, isProduction: boolean): Response {
  const headers = getSecurityHeaders(isProduction);

  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value);
  }

  response.headers.delete("X-Powered-By");

  return response;
}
