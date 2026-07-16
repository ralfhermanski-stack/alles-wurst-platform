import type { NextConfig } from "next";

import { legalProviderFrameSrcCsp } from "./lib/legal/legal-provider-hosts";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    const isProduction = process.env.NODE_ENV === "production";
    const legalFrameSrc = legalProviderFrameSrcCsp();

    const securityHeaders = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(), payment=(self), usb=()",
      },
      { key: "X-DNS-Prefetch-Control", value: "off" },
      {
        key: "Content-Security-Policy",
        value: [
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
        ].join("; "),
      },
      ...(isProduction
        ? [
            {
              key: "Strict-Transport-Security",
              value: "max-age=63072000; includeSubDomains; preload",
            },
          ]
        : []),
    ];

    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
