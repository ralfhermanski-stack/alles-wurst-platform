/**
 * @file blog-topic-clusters.ts
 * @purpose Standard-Themencluster für das Magazin.
 */

export const DEFAULT_BLOG_TOPIC_CLUSTERS = [
  { name: "Wurst selber machen", slug: "wurst-selber-machen", sortOrder: 10 },
  { name: "Marinaden", slug: "marinaden", sortOrder: 20 },
  { name: "Räuchern", slug: "raeuchern", sortOrder: 30 },
  { name: "Fleischkunde", slug: "fleischkunde", sortOrder: 40 },
  { name: "Hygiene", slug: "hygiene", sortOrder: 50 },
  { name: "Gewürze", slug: "gewuerze", sortOrder: 60 },
  { name: "Rezepte", slug: "rezepte", sortOrder: 70 },
  { name: "Anfängerwissen", slug: "anfaengerwissen", sortOrder: 80 },
  { name: "Fehler vermeiden", slug: "fehler-vermeiden", sortOrder: 90 },
  { name: "Ausrüstung", slug: "ausruestung", sortOrder: 100 },
  { name: "Kurse", slug: "kurse", sortOrder: 110 },
  { name: "Mitgliedschaft", slug: "mitgliedschaft", sortOrder: 120 },
] as const;
