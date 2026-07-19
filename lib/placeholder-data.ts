/**
 * Statische Platzhalterdaten für das klickbare Frontend-Grundgerüst.
 * KEINE Datenbank, KEINE API – nur Demo-Inhalte zur Ansicht.
 */

export type NavItem = {
  label: string;
  href: string;
};

export const marketingNav: NavItem[] = [
  { label: "Akademie", href: "/akademie" },
  { label: "Rezepte", href: "/rezepte" },
  { label: "Werkstatt", href: "/werkstatt" },
  { label: "Community", href: "/community" },
  { label: "Mitgliedschaft", href: "/mitgliedschaft" },
];

export const memberNav: NavItem[] = [
  { label: "Übersicht", href: "/mein-bereich" },
  { label: "Meine Kurse", href: "/mein-bereich/kurse" },
  { label: "Bestellungen", href: "/mein-bereich/bestellungen" },
  { label: "Nachrichten", href: "/mein-bereich/nachrichten" },
  { label: "Challenges", href: "/mein-bereich/challenges" },
  { label: "Support", href: "/mein-bereich/support" },
  { label: "Zertifikate", href: "/mein-bereich/zertifikate" },
  { label: "Datenschutz", href: "/account/datenschutz" },
];

export const adminNav: { group: string; items: NavItem[] }[] = [
  {
    group: "Allgemein",
    items: [
      { label: "Dashboard", href: "/admin" },
      { label: "Benutzer", href: "/admin" },
    ],
  },
  {
    group: "Inhalte",
    items: [
      { label: "Kurse", href: "/admin" },
      { label: "Mitgliedschaften", href: "/admin" },
      { label: "Werkstatt", href: "/admin" },
    ],
  },
  {
    group: "Beziehung",
    items: [
      { label: "Community", href: "/admin" },
      { label: "Support", href: "/admin" },
      { label: "Newsletter", href: "/admin" },
    ],
  },
  {
    group: "Kommerz",
    items: [
      { label: "Zahlungen", href: "/admin" },
      { label: "Rechnungen", href: "/admin" },
    ],
  },
];

export type Course = {
  slug: string;
  title: string;
  level: "Einsteiger" | "Fortgeschritten" | "Profi" | "Meister";
  duration: string;
  lessons: number;
  category: string;
  excerpt: string;
  accent: string;
};

export const courses: Course[] = [
  {
    slug: "grundlagen-wurst",
    title: "Grundlagen der Wurstherstellung",
    level: "Einsteiger",
    duration: "3 Std 20 Min",
    lessons: 18,
    category: "Grundlagen",
    excerpt:
      "Vom Fleisch bis zur fertigen Wurst – die wichtigsten Grundlagen für deinen Einstieg ins Handwerk.",
    accent: "from-aw-brown/40",
  },
  {
    slug: "bratwurst-meister",
    title: "Bratwurst-Meister",
    level: "Fortgeschritten",
    duration: "4 Std 05 Min",
    lessons: 24,
    category: "Wurstherstellung",
    excerpt:
      "Fettanteil, Gewürze und Brühgrad perfekt abstimmen – die klassische Bratwurst auf Meisterniveau.",
    accent: "from-aw-gold/25",
  },
  {
    slug: "kalt-raeuchern",
    title: "Kalträuchern wie ein Profi",
    level: "Profi",
    duration: "5 Std 40 Min",
    lessons: 31,
    category: "Räuchern",
    excerpt:
      "Räucherprogramme, Rauchführung und Reifung – für Schinken und Rohwurst mit Charakter.",
    accent: "from-aw-surface-2",
  },
  {
    slug: "rohwurst-fermentation",
    title: "Rohwurst & Fermentation",
    level: "Meister",
    duration: "6 Std 15 Min",
    lessons: 36,
    category: "Rohwurst",
    excerpt:
      "Starterkulturen, Reifeklima und Sicherheit – fermentierte Rohwürste souverän beherrschen.",
    accent: "from-aw-brown/40",
  },
  {
    slug: "poekeln-lake",
    title: "Pökeln & Lake-Techniken",
    level: "Fortgeschritten",
    duration: "3 Std 50 Min",
    lessons: 22,
    category: "Pökeln",
    excerpt:
      "Nass- und Trockenpökeln, Spritz- und Gleichgewichtslake – sicher und geschmackvoll.",
    accent: "from-aw-gold/25",
  },
  {
    slug: "wildverarbeitung",
    title: "Wild richtig verarbeiten",
    level: "Profi",
    duration: "4 Std 30 Min",
    lessons: 27,
    category: "Wild",
    excerpt:
      "Vom Aufbrechen bis zur Wildwurst – hygienisch, respektvoll und mit vollem Aroma.",
    accent: "from-aw-surface-2",
  },
];

export type MembershipTier = "bronze" | "silver" | "gold" | "gold-premium";

export type MembershipFeature = {
  icon: string;
  label: string;
  /** Hervorgehobener Vorteil (z. B. Preisvorteil) */
  highlight?: boolean;
};

export type Membership = {
  slug: string;
  name: string;
  tier: MembershipTier;
  price: string;
  period: string;
  /** Preishinweis, z. B. Monats-Äquivalent bei Jahresabo */
  priceNote?: string;
  /** Ersparnis-Text bei Jahresmitgliedschaften */
  savings?: string;
  tagline: string;
  /** Als beliebteste Mitgliedschaft markieren */
  popular?: boolean;
  /** Optisch hervorheben (Premium) */
  featured?: boolean;
  features: MembershipFeature[];
  cta: string;
};

export const memberships: Membership[] = [
  {
    slug: "wurst-club",
    name: "Wurst Club",
    tier: "bronze",
    price: "19,90 €",
    period: "pro Monat",
    tagline:
      "Dein Einstieg in die Welt des Wursthandwerks. Lerne die Grundlagen, tausche dich aus und starte deine ersten Kurse.",
    features: [
      { icon: "chat", label: "Zugang zum Community-Forum" },
      { icon: "users", label: "Austausch mit Gleichgesinnten" },
      { icon: "recipe", label: "Rezept des Monats" },
      { icon: "salt", label: "Voller Zugriff auf den Salzrechner" },
      { icon: "video", label: "Monatliches Zoom-Meeting mit dem Fleischermeister" },
      { icon: "spark", label: "Exklusive Mitgliederinhalte" },
    ],
    cta: "Mitgliedschaft wählen",
  },
  {
    slug: "wurst-club-pro",
    name: "Wurst Club Pro",
    tier: "silver",
    price: "189,00 €",
    period: "pro Jahr",
    priceNote: "entspricht 15,75 € / Monat",
    savings: "Spare 49,80 € gegenüber dem Monatsabo",
    tagline:
      "Mehr Wissen, mehr Praxis, mehr Ergebnisse. Für alle, die das Wursten ernsthaft lernen und kontinuierlich besser werden wollen.",
    popular: true,
    features: [
      { icon: "check", label: "Alle Vorteile des Wurst Clubs" },
      { icon: "coin", label: "Deutlicher Preisvorteil gegenüber dem Monatsabo", highlight: true },
      { icon: "brine", label: "Voller Zugriff auf den Lakerechner" },
      { icon: "book", label: "Zugriff auf das komplette Rezept-des-Monats-Archiv" },
      { icon: "unlock", label: "Freischaltung des Schnupperkurses" },
      { icon: "flag", label: "Teilnahme an Community-Aktionen und Challenges" },
      { icon: "clock", label: "Frühzeitiger Zugang zu neuen Inhalten" },
    ],
    cta: "Mitgliedschaft wählen",
  },
  {
    slug: "meisterklasse",
    name: "Meisterklasse Wurst Club",
    tier: "gold",
    price: "49,00 €",
    period: "pro Monat",
    tagline:
      "Der Meisterclub ist die Spitze des Wurst Clubs. Hier geht es um echtes Handwerk, eigene Rezeptentwicklung und den direkten Austausch mit dem Fleischermeister.",
    features: [
      { icon: "crown", label: "Alle Vorteile des Wurst Club Pro" },
      { icon: "video", label: "Zugang zu exklusiven Live-Q&As und Workshops" },
      { icon: "handshake", label: "Direkter Austausch mit dem Fleischermeister" },
      { icon: "salt", label: "Unterstützung bei der Entwicklung eigener Rezepte" },
      { icon: "book", label: "Zugriff auf den Rezeptersteller mit PDF-Ausgabe" },
      { icon: "ticket", label: "Zugang zu ausgewählten Live-Events" },
      { icon: "search", label: "Individuelle Rezeptprüfung auf Wunsch" },
    ],
    cta: "Mitgliedschaft wählen",
  },
  {
    slug: "meisterklasse-pro",
    name: "Meisterklasse Wurst Club Pro",
    tier: "gold-premium",
    price: "490,00 €",
    period: "pro Jahr",
    priceNote: "entspricht 40,83 € / Monat",
    savings: "Spare 98,00 € gegenüber dem Monatsabo",
    tagline:
      "Das Komplettpaket für alle, die ihr Handwerk auf das nächste Level bringen wollen.",
    featured: true,
    features: [
      { icon: "crown", label: "Alle Vorteile der Meisterklasse Wurst Club" },
      { icon: "coin", label: "Großer Preisvorteil gegenüber dem Monatsabo", highlight: true },
      { icon: "salt", label: "Unterstützung bei der Entwicklung eigener Rezepte" },
      { icon: "book", label: "Zugriff auf den Rezeptersteller mit PDF-Ausgabe" },
      { icon: "ticket", label: "Zugang zu ausgewählten Live-Events" },
      { icon: "search", label: "Individuelle Rezeptprüfung auf Wunsch" },
      { icon: "cap", label: "Freischaltung des kompletten Grundkurses" },
    ],
    cta: "Mitgliedschaft wählen",
  },
];

export type CourseCategory = {
  name: string;
  description: string;
  icon: string;
};

export const courseCategories: CourseCategory[] = [
  {
    name: "Wurstherstellung",
    description: "Brüh-, Koch- und Rohwurst souverän selbst herstellen.",
    icon: "sausage",
  },
  {
    name: "Bratwurst",
    description: "Die perfekte Bratwurst – von der Rezeptur bis zum Biss.",
    icon: "flame",
  },
  {
    name: "Grillen & BBQ",
    description: "Low & Slow, Grillmethoden und Raucharomen am Rost.",
    icon: "grill",
  },
  {
    name: "Räuchern",
    description: "Kalt- und Heißräuchern mit sicherer Rauchführung.",
    icon: "smoke",
  },
  {
    name: "Pökeln & Lake",
    description: "Nass- und Trockenpökeln, Laken exakt berechnen.",
    icon: "brine",
  },
  {
    name: "Wildverarbeitung",
    description: "Vom Aufbrechen bis zur fertigen Wildwurst.",
    icon: "leaf",
  },
  {
    name: "Fleischkunde",
    description: "Teilstücke, Qualität und Reifung richtig verstehen.",
    icon: "meat",
  },
  {
    name: "Grundlagen",
    description: "Hygiene, Werkzeuge und Basiswissen für den Start.",
    icon: "book",
  },
];

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readingTime: string;
  accent: string;
  icon: string;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "pökeln-grundlagen",
    title: "Pökeln verstehen: Nitritpökelsalz richtig dosieren",
    excerpt:
      "Warum die richtige Salzmenge über Sicherheit und Geschmack entscheidet – und wie du sie zuverlässig berechnest.",
    category: "Pökeln",
    date: "2. Juli 2026",
    readingTime: "6 Min",
    accent: "from-aw-gold/25",
    icon: "salt",
  },
  {
    slug: "kaltrauch-fehler",
    title: "Die 5 häufigsten Fehler beim Kalträuchern",
    excerpt:
      "Von zu hoher Temperatur bis falscher Luftfeuchte – so vermeidest du die typischen Stolperfallen im Räucherschrank.",
    category: "Räuchern",
    date: "24. Juni 2026",
    readingTime: "8 Min",
    accent: "from-aw-surface-2",
    icon: "smoke",
  },
  {
    slug: "bratwurst-gewuerze",
    title: "Bratwurst würzen wie ein Meister",
    excerpt:
      "Welche Gewürze in eine klassische Bratwurst gehören und wie du deine eigene Signatur-Mischung entwickelst.",
    category: "Bratwurst",
    date: "15. Juni 2026",
    readingTime: "5 Min",
    accent: "from-aw-brown/40",
    icon: "flame",
  },
];

export type Tool = {
  slug: string;
  name: string;
  description: string;
  access: "Öffentlich" | "Premium" | "Club" | "Meister";
  icon: string;
  /** Noch nicht verfügbar – Karte zeigt „Coming Soon“ statt Link. */
  comingSoon?: boolean;
};

export const tools: Tool[] = [
  {
    slug: "salzrechner",
    name: "Salzrechner",
    description:
      "Salz- und Nitritmenge pro Kilogramm exakt berechnen – ohne Lake, direkt einsatzbereit.",
    access: "Öffentlich",
    icon: "salt",
  },
  {
    slug: "lakerechner",
    name: "Lakerechner",
    description:
      "Lake neutral berechnen – nach Liter, Konzentration und Zutaten. Übersichtliches Lake-Rezept ohne Produktbindung.",
    access: "Premium",
    icon: "brine",
  },
  {
    slug: "rezeptgenerator",
    name: "Rezeptgenerator",
    description:
      "Wurstrezepturen erstellen, berechnen und speichern – mit Fleisch-, Schüttungs- und Gewürzlogik.",
    access: "Meister",
    icon: "recipe",
  },
  {
    slug: "rezeptdatenbank",
    name: "Rezeptdatenbank",
    description:
      "Offizielle Club-Rezepte durchsuchen und in den eigenen Rezeptgenerator kopieren.",
    access: "Club",
    icon: "recipe",
  },
  {
    slug: "marinaden-generator",
    name: "Marinaden-Generator",
    description:
      "Marinaden für Fleisch, Geflügel und Fisch skalieren, speichern und ausdrucken.",
    access: "Premium",
    icon: "marinade",
  },
  {
    slug: "rezeptanalyse",
    name: "Rezeptanalyse",
    description:
      "Technologieprofil deiner Rezeptur mit Referenzvergleich – die Meisterwerkstatt.",
    access: "Meister",
    icon: "analysis",
    comingSoon: true,
  },
  {
    slug: "empfehlungen",
    name: "Empfehlungen & Ausrüstung",
    description:
      "Kuratierte Ausrüstung: Wurstfüller, Fleischwolf, Messer, Därme, Gewürze und Zubehör.",
    access: "Öffentlich",
    icon: "shop",
  },
];

export type DashboardTile = {
  label: string;
  value: string;
  hint: string;
  icon: string;
};

const isDevelopment = process.env.NODE_ENV === "development";

export const dashboardTiles: DashboardTile[] = isDevelopment
  ? [
      {
        label: "Aktive Kurse",
        value: "3",
        hint: "1 kurz vor Abschluss",
        icon: "book",
      },
      {
        label: "Zertifikate",
        value: "2",
        hint: "zuletzt: Bratwurst-Meister",
        icon: "medal",
      },
      {
        label: "Gespeicherte Rezepte",
        value: "12",
        hint: "3 öffentlich geteilt",
        icon: "recipe",
      },
      {
        label: "Ungelesene Nachrichten",
        value: "4",
        hint: "im Community-Postfach",
        icon: "chat",
      },
    ]
  : [];

export const dashboardCourses = isDevelopment
  ? [
      {
        title: "Bratwurst-Meister",
        progress: 82,
        next: "Modul 5 – Zubereitung",
      },
      {
        title: "Kalträuchern wie ein Profi",
        progress: 45,
        next: "Modul 3 – Rauchführung",
      },
      {
        title: "Pökeln & Lake-Techniken",
        progress: 18,
        next: "Modul 1 – Grundlagen",
      },
    ]
  : [];

export const adminStats = [
  { label: "Aktive Mitglieder", value: "2.487", trend: "+128 (30 T)", tone: "success" },
  { label: "Umsatz (Monat)", value: "18.940 €", trend: "+9,2 %", tone: "success" },
  { label: "Offene Tickets", value: "23", trend: "5 dringend", tone: "warning" },
  { label: "Kursabschlüsse", value: "412", trend: "+37 (30 T)", tone: "success" },
];

export const adminActivity = [
  { time: "vor 5 Min", text: "Neue Registrierung: h.weber@example.de" },
  { time: "vor 22 Min", text: "Premium-Abo abgeschlossen von M. Schuster" },
  { time: "vor 1 Std", text: "Support-Ticket #AW-TKT-2026-0231 (dringend) eröffnet" },
  { time: "vor 2 Std", text: "Kurs „Rohwurst & Fermentation“ veröffentlicht" },
  { time: "vor 3 Std", text: "Zertifikat AW-CERT-2026-00188 ausgestellt" },
];

// ── Rezeptdatenbank (Wissensbibliothek) ──────────────────────────────────────

export type RecipeAccess = "Gast" | "Wurst Club" | "Wurst Club Pro" | "Meisterklasse";

export type Recipe = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  difficulty: "Einfach" | "Mittel" | "Anspruchsvoll";
  time: string;
  access: RecipeAccess;
  accent: string;
  icon: string;
};

export const recipeOfMonth = {
  title: "Fränkische Bratwurst – klassisch grob",
  category: "Bratwurst",
  difficulty: "Mittel" as const,
  time: "ca. 90 Min",
  excerpt:
    "Grob gewolft, mild gewürzt mit Majoran und Muskat – die fränkische Bratwurst ist ein zeitloser Klassiker. Dieses Monatsrezept führt dich Schritt für Schritt zur perfekten Brätkonsistenz.",
  accent: "from-aw-gold/25",
  icon: "flame",
};

export const recipeCategories: { name: string; icon: string; count: number }[] = [
  { name: "Brühwurst", icon: "sausage", count: 84 },
  { name: "Rohwurst", icon: "meat", count: 63 },
  { name: "Kochwurst", icon: "recipe", count: 41 },
  { name: "Bratwurst", icon: "flame", count: 57 },
  { name: "Schinken & Pökelware", icon: "brine", count: 38 },
  { name: "Räucherwaren", icon: "smoke", count: 46 },
  { name: "Marinaden & Rubs", icon: "marinade", count: 52 },
  { name: "Grundrezepte", icon: "book", count: 29 },
];

export const sampleRecipes: Recipe[] = [
  {
    slug: "wiener-wuerstchen",
    title: "Wiener Würstchen",
    excerpt: "Fein gebrühte Klassiker mit zartem Biss – ideal für den Einstieg in die Brühwurst.",
    category: "Brühwurst",
    difficulty: "Einfach",
    time: "120 Min",
    access: "Wurst Club",
    accent: "from-aw-brown/40",
    icon: "sausage",
  },
  {
    slug: "leberkaese",
    title: "Bayerischer Leberkäse",
    excerpt: "Feinbrät, sauber gebacken – die goldene Kruste ist das Geheimnis.",
    category: "Kochwurst",
    difficulty: "Mittel",
    time: "150 Min",
    access: "Wurst Club",
    accent: "from-aw-gold/25",
    icon: "recipe",
  },
  {
    slug: "ungarische-salami",
    title: "Ungarische Salami",
    excerpt: "Edelschimmel, langsame Reifung und feine Paprikanote – hohe Rohwurstkunst.",
    category: "Rohwurst",
    difficulty: "Anspruchsvoll",
    time: "6–8 Wochen",
    access: "Wurst Club Pro",
    accent: "from-aw-surface-2",
    icon: "meat",
  },
  {
    slug: "kabanossi",
    title: "Kabanossi",
    excerpt: "Würzig-geräucherte Schnittfeste zum Snacken – ein echter Dauerbrenner.",
    category: "Rohwurst",
    difficulty: "Mittel",
    time: "3–4 Wochen",
    access: "Wurst Club Pro",
    accent: "from-aw-brown/40",
    icon: "smoke",
  },
  {
    slug: "schwarzwaelder-schinken",
    title: "Schwarzwälder Schinken",
    excerpt: "Gepökelt, kalt geräuchert, luftgereift – Geduld wird mit Aroma belohnt.",
    category: "Schinken & Pökelware",
    difficulty: "Anspruchsvoll",
    time: "8–12 Wochen",
    access: "Meisterklasse",
    accent: "from-aw-surface-2",
    icon: "brine",
  },
  {
    slug: "chorizo",
    title: "Chorizo",
    excerpt: "Spanische Rohwurst mit Pimentón – kräftig, rauchig und unverkennbar rot.",
    category: "Rohwurst",
    difficulty: "Mittel",
    time: "3–5 Wochen",
    access: "Wurst Club Pro",
    accent: "from-aw-gold/25",
    icon: "flame",
  },
];

export const lockedRecipes: Recipe[] = [
  {
    slug: "trueffel-mettwurst",
    title: "Trüffel-Mettwurst (Meisterrezept)",
    excerpt: "Exklusive Rezeptur mit Sommertrüffel – nur für die Meisterklasse.",
    category: "Meisterrezept",
    difficulty: "Anspruchsvoll",
    time: "4 Wochen",
    access: "Meisterklasse",
    accent: "from-aw-gold/25",
    icon: "crown",
  },
  {
    slug: "fermentierte-chili-salami",
    title: "Fermentierte Chili-Salami",
    excerpt: "Kontrollierte Fermentation mit Starterkulturen und feuriger Schärfe.",
    category: "Meisterrezept",
    difficulty: "Anspruchsvoll",
    time: "6 Wochen",
    access: "Meisterklasse",
    accent: "from-aw-brown/40",
    icon: "meat",
  },
  {
    slug: "wagyu-bratwurst",
    title: "Wagyu-Bratwurst",
    excerpt: "Premium-Brät aus marmoriertem Wagyu – dezent gewürzt, maximaler Genuss.",
    category: "Bratwurst",
    difficulty: "Mittel",
    time: "90 Min",
    access: "Wurst Club Pro",
    accent: "from-aw-surface-2",
    icon: "flame",
  },
];

export type RecipeTier = {
  tier: string;
  tierKey: "gast" | "bronze" | "silver" | "gold";
  note: string;
  items: string[];
};

export const recipeAccess: RecipeTier[] = [
  {
    tier: "Gast",
    tierKey: "gast",
    note: "kostenlos",
    items: ["Rezept des Monats"],
  },
  {
    tier: "Wurst Club",
    tierKey: "bronze",
    note: "Bronze",
    items: ["Rezept des Monats", "Archiv: Rezept des Monats"],
  },
  {
    tier: "Wurst Club Pro",
    tierKey: "silver",
    note: "Silber",
    items: ["Alle Club-Inhalte", "Erweiterte Rezeptbibliothek"],
  },
  {
    tier: "Meisterklasse",
    tierKey: "gold",
    note: "Gold",
    items: [
      "Vollständige Rezeptdatenbank",
      "Eigene Rezepte anlegen",
      "Exklusive Meisterrezepte",
      "Rezeptanalyse",
    ],
  },
];

// ── Hilfe & Unterstützung (Startseite) ───────────────────────────────────────

export type HelpOption = {
  icon: string;
  title: string;
  description: string;
};

export const helpOptions: HelpOption[] = [
  {
    icon: "book",
    title: "Wissensdatenbank",
    description:
      "Antworten auf häufige Fragen, Anleitungen und Hilfestellungen rund um Plattform und Handwerk.",
  },
  {
    icon: "ticket",
    title: "Support-Tickets",
    description:
      "Stelle deine Fragen strukturiert und verfolge den Bearbeitungsstand jederzeit.",
  },
  {
    icon: "users",
    title: "Community Forum",
    description:
      "Tausche Erfahrungen aus, erhalte Tipps und lerne von anderen Mitgliedern.",
  },
  {
    icon: "crown",
    title: "Meister-Support",
    description:
      "Exklusive Unterstützung für Meisterclub-Mitglieder direkt vom Fleischermeister.",
  },
];

// ── Community & Social Media (Startseite) ────────────────────────────────────

export type SocialPlatform = {
  icon: string;
  name: string;
  description: string;
  followers: string;
  accent: string;
  preview: { label: string; accent: string }[];
};

export const socialPlatforms: SocialPlatform[] = [
  {
    icon: "tiktok",
    name: "TikTok",
    description: "Kurze Praxistipps, Rezeptideen und Einblicke aus dem Wurstkessel.",
    followers: "+1.200",
    accent: "from-aw-gold/20",
    preview: [
      { label: "Brät-Tipp", accent: "from-aw-gold/30" },
      { label: "Gewürzmischung", accent: "from-aw-brown/40" },
      { label: "Wurstkessel", accent: "from-aw-surface-2" },
    ],
  },
  {
    icon: "instagram",
    name: "Instagram",
    description: "Visuelle Inspiration, Rezeptfotos und Einblicke hinter die Kulissen.",
    followers: "+3.400",
    accent: "from-aw-gold/25",
    preview: [
      { label: "Bratwurst", accent: "from-aw-gold/25" },
      { label: "Werkstatt", accent: "from-aw-brown/40" },
      { label: "Meisterstück", accent: "from-aw-surface-2" },
    ],
  },
  {
    icon: "facebook",
    name: "Facebook",
    description: "Community-Austausch, Events und Neuigkeiten aus der Alles-Wurst Welt.",
    followers: "+2.800",
    accent: "from-aw-brown/35",
    preview: [
      { label: "Gruppe", accent: "from-aw-gold/20" },
      { label: "Live-Q&A", accent: "from-aw-brown/40" },
      { label: "Rezept", accent: "from-aw-surface-2" },
    ],
  },
  {
    icon: "youtube",
    name: "YouTube",
    description: "Ausführliche Tutorials, Kursausschnitte und Meister-Demonstrationen.",
    followers: "+5.600",
    accent: "from-aw-gold/20",
    preview: [
      { label: "Tutorial", accent: "from-aw-gold/25" },
      { label: "Kursclip", accent: "from-aw-brown/40" },
      { label: "Meister", accent: "from-aw-surface-2" },
    ],
  },
];

export type ChallengeEntry = {
  author: string;
  initials: string;
  accent: string;
};

export const monthlyChallenge = {
  title: "Die perfekte Bratwurst",
  description:
    "Zeige dein Ergebnis, teile deine Erfahrungen und werde Teil der Community.",
  participants: 847,
  period: "1.–31. Juli 2026",
  accent: "from-aw-gold/25",
  entries: [
    { author: "Markus S.", initials: "MS", accent: "from-aw-brown/40" },
    { author: "Julia K.", initials: "JK", accent: "from-aw-gold/25" },
    { author: "Thomas B.", initials: "TB", accent: "from-aw-surface-2" },
    { author: "Anna W.", initials: "AW", accent: "from-aw-brown/40" },
    { author: "Peter H.", initials: "PH", accent: "from-aw-gold/20" },
    { author: "Lisa M.", initials: "LM", accent: "from-aw-surface-2" },
  ] satisfies ChallengeEntry[],
};

// ── Philosophie (Startseite) ───────────────────────────────────────────────────

export type PhilosophyValue = {
  icon: string;
  title: string;
  description: string;
};

export const philosophyValues: PhilosophyValue[] = [
  {
    icon: "unlock",
    title: "Kontrolle zurückgewinnen",
    description: "Bestimme selbst, welche Zutaten verwendet werden.",
  },
  {
    icon: "spark",
    title: "Eigenen Geschmack entwickeln",
    description: "Nicht die Industrie entscheidet, wie deine Produkte schmecken.",
  },
  {
    icon: "cap",
    title: "Handwerk verstehen",
    description: "Lerne traditionelle Techniken verständlich und praxisnah.",
  },
  {
    icon: "book",
    title: "Wissen bewahren",
    description: "Erhalte echtes Fleischerwissen für kommende Generationen.",
  },
  {
    icon: "medal",
    title: "Stolz auf das Ergebnis",
    description:
      "Es gibt kaum etwas Schöneres, als ein eigenes Produkt mit Familie und Freunden zu teilen.",
  },
];

export const philosophyQuote =
  "Wer versteht, was in seinem Essen steckt, entscheidet bewusster, genießt intensiver und wird unabhängiger.";
