/**
 * @file page-seo-static-registry.ts
 * @purpose Inhaltsdefinitionen für statische öffentliche Seiten.
 */

import type { PageSeoContentInput } from "./page-seo-types";
import { staticRouteKey } from "./page-seo-site";

type StaticPageDefinition = {
  path: string;
  title: string;
  description: string;
  heroText?: string;
  headings?: string[];
  bodyText?: string;
  imageUrl?: string;
  isLegalPage?: boolean;
};

const STATIC_PAGES: StaticPageDefinition[] = [
  {
    path: "/",
    title: "Alles-Wurst – Handwerkliche Wurstherstellung",
    description:
      "Lerne Wurst selber machen in strukturierten Kursen, nutze präzise Werkzeuge und werde Teil einer Community für Fleischverarbeitung und Räuchern.",
    heroText:
      "Handwerkliche Wurstherstellung – Schritt für Schritt zum Meister. Lerne in strukturierten Kursen, nutze präzise Werkzeuge und werde Teil einer Community, die das Fleischerhandwerk lebt.",
    headings: ["Kursbereiche", "Empfohlene Kurse", "Werkstatt", "Magazin"],
    bodyText:
      "Alles-Wurst verbindet Akademie, Werkstatt, Magazin und Community für Wurstherstellung, Räuchern, Marinaden und handwerkliches Fleischwissen.",
    imageUrl: "/hero-werkstatt.png",
  },
  {
    path: "/akademie",
    title: "Akademie",
    description:
      "Strukturierte Lernpfade und Kurse für Wurstherstellung, Räuchern und Fleischverarbeitung.",
    bodyText:
      "Die Alles-Wurst Akademie bietet strukturierte Lernpfade und Kurse für Wurstherstellung, Räuchern und Fleischverarbeitung.",
  },
  {
    path: "/akademie/kurse",
    title: "Kurse",
    description: "Der vollständige Kurskatalog der Alles-Wurst Akademie.",
    bodyText: "Alle veröffentlichten Kurse der Akademie im Überblick.",
  },
  {
    path: "/akademie/kurse/beispielkurs",
    title: "Grundlagen der Wurstherstellung – Kurs",
    description:
      "Beispielhafte Kursdetailseite der Alles-Wurst Akademie – Design- und Strukturvorlage.",
    bodyText: "Beispielkurs zur Darstellung der Kursstruktur in der Akademie.",
  },
  {
    path: "/werkstatt",
    title: "Werkstatt",
    description:
      "Digitale Werkzeuge: Salzrechner, Lakerechner, Rezept- und Marinaden-Generator, Rezeptanalyse und kuratierte Produkte.",
    bodyText:
      "Die Werkstatt bündelt Rechner und Generatoren für Salz, Lake, Rezepturen und Rezeptdatenbank.",
  },
  {
    path: "/werkstatt/salzrechner",
    title: "Salzrechner",
    description:
      "Berechne die benötigte Salzmenge für Fleisch und Wurst – Salzgabe in g/kg mit Bewertung mild, normal oder stark.",
    bodyText: "Tool zur Berechnung der Salzmenge für Wurst und Fleisch.",
  },
  {
    path: "/werkstatt/lakerechner",
    title: "Lakerechner",
    description:
      "Lake neutral berechnen – Liter, Konzentration und Zutaten. Als übersichtliches Lake-Rezept.",
    bodyText: "Tool zur Berechnung von Pöllake und Konzentration.",
  },
  {
    path: "/werkstatt/rezeptgenerator",
    title: "Rezeptgenerator",
    description:
      "Wurstrezepturen erstellen, berechnen und speichern – mit Fleisch-, Schüttungs- und Gewürzlogik.",
    bodyText: "Generator für eigene Wurstrezepturen mit Berechnungslogik.",
  },
  {
    path: "/werkstatt/rezeptdatenbank",
    title: "Rezeptdatenbank",
    description:
      "Offizielle Alles-Wurst Rezepte durchsuchen, filtern und in den eigenen Rezeptgenerator kopieren.",
    bodyText: "Kuratierte Rezeptsammlung der Plattform.",
  },
  {
    path: "/werkstatt/empfehlungen",
    title: "Empfehlungen & Ausrüstung",
    description:
      "Kuratierte Produktempfehlungen für Wurstherstellung: Werkzeuge, Maschinen, Gewürze und Zubehör.",
    bodyText: "Empfohlene Ausrüstung und Partnerprodukte für die Werkstatt.",
  },
  {
    path: "/magazin",
    title: "Magazin",
    description:
      "Wissen rund um Wurst selber machen, Räuchern, Fleischkunde und Hygiene — vom Fleischermeister erklärt.",
    bodyText: "Fachartikel und Ratgeber zum Thema Wurst und Fleischverarbeitung.",
  },
  {
    path: "/community",
    title: "Community",
    description: "Forum und Mitgliederprofile – tausche dich mit Gleichgesinnten aus.",
    bodyText: "Community-Bereich für Austausch rund um Wurstherstellung.",
  },
  {
    path: "/mitgliedschaft",
    title: "Mitgliedschaft",
    description:
      "Wurst Club, Wurst Club Pro und die Meisterklasse – wähle die Mitgliedschaft, die zu deinem Handwerk passt.",
    bodyText: "Mitgliedschaftsmodelle für Zugang zu Kursen, Werkstatt und Community.",
  },
  {
    path: "/kaufen",
    title: "Kaufen",
    description:
      "Wurstclub, Meisterclub, Kurse und Workshops — Zahlung per Überweisung oder manuelle Freigabe vorbereiten.",
    bodyText: "Produktübersicht für Mitgliedschaften, Kurse und Workshops.",
  },
  {
    path: "/rezepte",
    title: "Rezepte",
    description:
      "Die Alles-Wurst Rezeptdatenbank – eine wachsende Wissensbibliothek mit Rezepten für Wurst und Fleisch.",
    bodyText: "Rezeptübersicht und Inspiration für Wurstherstellung.",
  },
  {
    path: "/kontakt",
    title: "Kontakt",
    description: "Nimm Kontakt mit dem Alles-Wurst-Team auf.",
    bodyText: "Kontaktmöglichkeiten zum Alles-Wurst-Team.",
  },
  {
    path: "/impressum",
    title: "Impressum",
    description: "Impressum der Alles-Wurst Plattform.",
    bodyText:
      "Impressumsangaben gemäß DDG. Platzhaltertexte werden vor Veröffentlichung ergänzt.",
    isLegalPage: true,
  },
  {
    path: "/datenschutz",
    title: "Datenschutz",
    description: "Datenschutzerklärung der Alles-Wurst Plattform.",
    bodyText: "Datenschutzhinweise der Plattform.",
    isLegalPage: true,
  },
];

export function listStaticPageDefinitions(): StaticPageDefinition[] {
  return STATIC_PAGES;
}

export function staticPageToContent(def: StaticPageDefinition): PageSeoContentInput {
  return {
    routeKey: staticRouteKey(def.path),
    path: def.path,
    pageType: "static",
    entityId: null,
    isPublished: true,
    title: def.title,
    heroText: def.heroText ?? def.description,
    description: def.description,
    headings: def.headings ?? [],
    bodyText: def.bodyText ?? def.description,
    imageUrl: def.imageUrl ?? null,
    imageAlt: def.imageUrl ? def.title : null,
    isLegalPage: def.isLegalPage ?? false,
  };
}

export function getStaticPageContent(path: string): PageSeoContentInput | null {
  const normalized = path === "/" ? "/" : path.replace(/\/+$/, "");
  const def = STATIC_PAGES.find((page) => page.path === normalized);

  if (!def) {
    return null;
  }

  return staticPageToContent(def);
}
