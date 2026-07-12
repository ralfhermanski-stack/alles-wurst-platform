const fs = require("node:fs");
const path = require("node:path");

function buildPhilosophyPlaceholderSvg(title, subtitle = "Platzhalterbild") {
  const safeTitle = title
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 640" role="img" aria-label="${safeTitle}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3d2e14" stop-opacity="0.65"/>
      <stop offset="45%" stop-color="#1a2327"/>
      <stop offset="100%" stop-color="#12171a"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#d4af37" stop-opacity="0.15"/>
      <stop offset="50%" stop-color="#d4af37" stop-opacity="0.45"/>
      <stop offset="100%" stop-color="#d4af37" stop-opacity="0.15"/>
    </linearGradient>
  </defs>
  <rect width="960" height="640" fill="url(#bg)"/>
  <circle cx="820" cy="110" r="150" fill="#d4af37" fill-opacity="0.07"/>
  <circle cx="120" cy="540" r="180" fill="#c1824a" fill-opacity="0.08"/>
  <rect x="48" y="48" width="864" height="544" rx="20" fill="none" stroke="url(#gold)" stroke-width="2"/>
  <g fill="none" stroke="#d4af37" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.55">
    <rect x="404" y="200" width="152" height="112" rx="10"/>
    <circle cx="444" cy="242" r="12"/>
    <path d="M424 292l36-28 28 22 48-40"/>
  </g>
  <text x="480" y="380" text-anchor="middle" fill="#f5f0e6" font-family="Georgia, 'Times New Roman', serif" font-size="34" font-weight="700">${safeTitle}</text>
  <text x="480" y="418" text-anchor="middle" fill="#d4af37" font-family="system-ui, sans-serif" font-size="14" letter-spacing="0.28em">${subtitle.toUpperCase()}</text>
  <text x="480" y="452" text-anchor="middle" fill="#9aa3a8" font-family="system-ui, sans-serif" font-size="13">Im Adminbereich durch finales Bild ersetzen</text>
</svg>`;
}

const dir = path.join(__dirname, "..", "public", "images", "placeholders", "philosophy");
fs.mkdirSync(dir, { recursive: true });

const files = {
  "geduld-im-handwerk.svg": "Geduld im Handwerk",
  "respekt-vor-dem-tier.svg": "Respekt vor dem Tier",
  "gute-zutaten.svg": "Gute Zutaten",
  "wenig-zusatzstoffe.svg": "So wenig Zusatzstoffe wie möglich",
  "freiheit-geschmack.svg": "Freiheit für den eigenen Geschmack",
  "fleischermeister-leidenschaft.svg": "Fleischermeister aus Leidenschaft",
  "hero.svg": "Unsere Philosophie",
};

for (const [file, title] of Object.entries(files)) {
  const subtitle = file === "hero.svg" ? "Alles Wurst" : "Platzhalterbild";
  fs.writeFileSync(path.join(dir, file), buildPhilosophyPlaceholderSvg(title, subtitle));
}

console.log("SVG placeholders written:", Object.keys(files).length);
