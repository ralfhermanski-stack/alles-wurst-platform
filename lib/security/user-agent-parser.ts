/**
 * @file user-agent-parser.ts
 * @purpose Einfache Browser/OS-Erkennung aus User-Agent.
 */

export function parseUserAgent(userAgent: string | null): {
  browser: string | null;
  os: string | null;
  deviceLabel: string | null;
} {
  if (!userAgent) {
    return { browser: null, os: null, deviceLabel: null };
  }

  const ua = userAgent.toLowerCase();

  let browser = "Unbekannt";
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("chrome/") && !ua.includes("chromium")) browser = "Chrome";
  else if (ua.includes("firefox/")) browser = "Firefox";
  else if (ua.includes("safari/") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("opera") || ua.includes("opr/")) browser = "Opera";

  let os = "Unbekannt";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac os") || ua.includes("macintosh")) os = "macOS";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
  else if (ua.includes("linux")) os = "Linux";

  const deviceLabel = `${browser} auf ${os}`;

  return { browser, os, deviceLabel };
}

export function isLikelyBot(userAgent: string | null): boolean {
  if (!userAgent) {
    return true;
  }

  const ua = userAgent.toLowerCase();

  return (
    ua.includes("bot")
    || ua.includes("crawler")
    || ua.includes("spider")
    || ua.includes("curl/")
    || ua.includes("wget/")
    || ua.includes("python-requests")
    || ua.includes("scrapy")
    || ua.includes("headless")
  );
}
