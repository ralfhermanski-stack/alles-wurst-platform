/**
 * @file course-group-image-fallback.ts
 * @purpose Fallback-Bild für Kursgruppen ohne eigenes Bild.
 */

export function buildCourseGroupFallbackSvg(title: string): string {
  const safeTitle = title
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 40);

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3d2b1f"/>
      <stop offset="100%" stop-color="#1a1410"/>
    </linearGradient>
  </defs>
  <rect width="800" height="500" fill="url(#bg)"/>
  <circle cx="400" cy="210" r="72" fill="#d4af37" fill-opacity="0.15"/>
  <text x="400" y="330" text-anchor="middle" fill="#f5e6c8" font-family="Georgia, serif" font-size="28" font-weight="700">${safeTitle}</text>
  <text x="400" y="370" text-anchor="middle" fill="#d4af37" font-family="Arial, sans-serif" font-size="16" letter-spacing="4">ALLES-WURST</text>
</svg>`;

  return svg;
}
