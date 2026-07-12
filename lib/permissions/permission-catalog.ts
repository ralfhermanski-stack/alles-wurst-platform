/**
 * @file permission-catalog.ts
 * @purpose Zentraler, strukturierter Berechtigungskatalog (keine freien Texteingaben).
 */

import type { PermissionActionKey, PermissionCatalogEntry, PermissionCategory } from "./permission-types";

const ACTION_LABELS: Record<PermissionActionKey, string> = {
  view: "sehen",
  open: "öffnen",
  use: "benutzen",
  create: "erstellen",
  edit: "bearbeiten",
  delete: "löschen",
  publish: "veröffentlichen",
  manage: "verwalten",
  export: "exportieren",
  share: "teilen",
  moderate: "moderieren",
};

type AreaDef = {
  key: string;
  name: string;
  category: PermissionCategory;
  actions?: PermissionActionKey[];
  criticalActions?: PermissionActionKey[];
  superAdminOnly?: boolean;
};

function areaPermissions(area: AreaDef, sortBase: number): PermissionCatalogEntry[] {
  const actions = area.actions ?? [
    "view",
    "open",
    "use",
    "create",
    "edit",
    "delete",
    "export",
    "share",
    "manage",
  ];

  return actions.map((action, index) => ({
    key: `${area.key}.${action}`,
    name: `${area.name} — ${ACTION_LABELS[action].charAt(0).toUpperCase()}${ACTION_LABELS[action].slice(1)}`,
    description: `Berechtigung: ${area.name} ${ACTION_LABELS[action]}.`,
    category: area.category,
    areaKey: area.key,
    actionKey: action,
    isCritical: area.criticalActions?.includes(action) ?? false,
    superAdminOnly: area.superAdminOnly ?? false,
    sortOrder: sortBase + index,
  }));
}

const WORKSHOP_AREAS: AreaDef[] = [
  { key: "workshop.home", name: "Werkstatt-Startseite", category: "werkstatt" },
  { key: "workshop.recipe-generator", name: "Rezeptgenerator", category: "werkstatt" },
  { key: "workshop.recipe-database", name: "Rezeptdatenbank", category: "werkstatt" },
  { key: "workshop.own-recipes", name: "Eigene Rezepte", category: "werkstatt" },
  { key: "workshop.recipe-of-month", name: "Rezept des Monats", category: "werkstatt" },
  { key: "workshop.salt-calculator", name: "Salzrechner", category: "werkstatt" },
  { key: "workshop.brine-calculator", name: "Lakerechner", category: "werkstatt" },
  { key: "workshop.marinade-generator", name: "Marinaden-Generator", category: "werkstatt" },
  { key: "workshop.spice-calculator", name: "Gewürzrechner", category: "werkstatt" },
  { key: "workshop.production-calculator", name: "Produktionsrechner", category: "werkstatt" },
  { key: "workshop.casing-calculator", name: "Därmerechner", category: "werkstatt" },
  { key: "workshop.costing-calculator", name: "Kalkulationsrechner", category: "werkstatt" },
  { key: "workshop.pdf-export", name: "PDF-Export", category: "werkstatt" },
  { key: "workshop.recipe-import", name: "Rezept-Import", category: "werkstatt" },
  { key: "workshop.recipe-export", name: "Rezept-Export", category: "werkstatt" },
  { key: "workshop.saved-templates", name: "Gespeicherte Vorlagen", category: "werkstatt" },
  { key: "workshop.favorites", name: "Favoriten", category: "werkstatt" },
  { key: "workshop.product-recommendations", name: "Empfehlungen & Ausrüstung", category: "werkstatt", actions: ["view", "open", "use"] },
  { key: "workshop.shared-recipes", name: "Geteilte Benutzerrezepte", category: "werkstatt" },
];

const ADMIN_AREAS: AreaDef[] = [
  { key: "admin.dashboard", name: "Admin-Dashboard", category: "administration" },
  { key: "admin.users", name: "Benutzerverwaltung", category: "administration", criticalActions: ["manage", "edit", "delete"] },
  { key: "admin.user-groups", name: "Benutzergruppen", category: "administration", criticalActions: ["manage"], superAdminOnly: true },
  { key: "admin.roles", name: "Rollen und Rechte", category: "administration", criticalActions: ["manage"], superAdminOnly: true },
  { key: "admin.memberships", name: "Mitgliedschaften", category: "administration" },
  { key: "admin.courses", name: "Kurse", category: "administration" },
  { key: "admin.course-groups", name: "Kursgruppen", category: "administration" },
  { key: "admin.lessons", name: "Lektionen", category: "administration" },
  { key: "admin.certificates", name: "Zertifikate", category: "administration" },
  { key: "admin.diplomas", name: "Urkunden", category: "administration" },
  { key: "admin.recipes", name: "Rezepte", category: "administration" },
  { key: "admin.recipe-categories", name: "Rezeptkategorien", category: "administration" },
  { key: "admin.workshop-settings", name: "Werkstatt-Einstellungen", category: "administration" },
  { key: "admin.product-recommendations", name: "Produktempfehlungen", category: "administration" },
  { key: "admin.forums", name: "Foren", category: "administration" },
  { key: "admin.tickets", name: "Tickets", category: "administration" },
  { key: "admin.blog", name: "Blog", category: "administration" },
  { key: "admin.media", name: "Medien", category: "administration" },
  { key: "admin.reviews", name: "Bewertungen", category: "administration" },
  { key: "admin.accounting", name: "Buchhaltung", category: "accounting", criticalActions: ["view", "manage"] },
  { key: "admin.stripe", name: "Stripe", category: "payments", criticalActions: ["manage"] },
  { key: "admin.paypal", name: "PayPal", category: "payments", criticalActions: ["manage"] },
  { key: "admin.orders", name: "Bestellungen", category: "accounting" },
  { key: "admin.invoices", name: "Rechnungen", category: "accounting" },
  { key: "admin.newsletter", name: "Newsletter", category: "administration" },
  { key: "admin.analytics", name: "Analytics", category: "administration" },
  { key: "admin.seo", name: "SEO", category: "administration" },
  { key: "admin.maintenance", name: "Wartungsmodus", category: "system", criticalActions: ["manage"] },
  { key: "admin.system-settings", name: "Systemeinstellungen", category: "system", criticalActions: ["manage"], superAdminOnly: true },
  { key: "admin.audit-log", name: "Audit-Log", category: "system" },
  { key: "admin.security", name: "Sicherheit", category: "system", criticalActions: ["manage", "view"], superAdminOnly: false },
  { key: "admin.privacy", name: "Datenschutz", category: "privacy" },
  { key: "admin.sharing", name: "Freigaben und Social Sharing", category: "social" },
  { key: "admin.email", name: "E-Mail-System", category: "administration" },
];

const RECIPE_PERMISSIONS: PermissionCatalogEntry[] = [
  { key: "recipe.view.public", name: "Öffentliche Rezepte sehen", description: "Zugriff auf öffentliche Rezepte.", category: "recipes", areaKey: "recipe", actionKey: "view", sortOrder: 100 },
  { key: "recipe.view.monthly", name: "Rezept des Monats sehen", description: "Zugriff auf das Rezept des Monats.", category: "recipes", areaKey: "recipe", actionKey: "view", sortOrder: 101 },
  { key: "recipe.view.premium", name: "Premium-Rezepte sehen", description: "Zugriff auf Premium-Rezeptinhalte.", category: "recipes", areaKey: "recipe", actionKey: "view", sortOrder: 102 },
  { key: "recipe.view.admin", name: "Admin-Rezepte sehen", description: "Zugriff auf offizielle Admin-Rezepte.", category: "recipes", areaKey: "recipe", actionKey: "view", sortOrder: 103 },
  { key: "recipe.create", name: "Rezept erstellen", description: "Neues eigenes Rezept anlegen.", category: "recipes", areaKey: "recipe", actionKey: "create", sortOrder: 104 },
  { key: "recipe.edit.own", name: "Eigenes Rezept bearbeiten", description: "Nur eigene Rezepte bearbeiten.", category: "recipes", areaKey: "recipe", actionKey: "edit", sortOrder: 105 },
  { key: "recipe.delete.own", name: "Eigenes Rezept löschen", description: "Nur eigene Rezepte löschen.", category: "recipes", areaKey: "recipe", actionKey: "delete", sortOrder: 106 },
  { key: "recipe.export.own", name: "Eigenes Rezept exportieren", description: "Nur eigene Rezepte exportieren.", category: "recipes", areaKey: "recipe", actionKey: "export", sortOrder: 107 },
  { key: "recipe.pdf.own", name: "PDF für eigenes Rezept", description: "PDF nur für eigene Rezepte erzeugen.", category: "recipes", areaKey: "recipe", actionKey: "export", sortOrder: 108 },
  { key: "recipe.share.own", name: "Eigenes Rezept teilen", description: "Nur eigene USER-Rezepte teilen.", category: "recipes", areaKey: "recipe", actionKey: "share", sortOrder: 109 },
  { key: "recipe.submit", name: "Rezept zur Prüfung einreichen", description: "Rezept zur Moderation einreichen.", category: "recipes", areaKey: "recipe", actionKey: "publish", sortOrder: 110 },
  { key: "recipe.publish.own", name: "Eigenes Rezept veröffentlichen", description: "Eigenes Rezept veröffentlichen.", category: "recipes", areaKey: "recipe", actionKey: "publish", sortOrder: 111 },
  { key: "recipe.moderate", name: "Rezeptfreigaben moderieren", description: "Fremde Rezepte prüfen und freigeben.", category: "recipes", areaKey: "recipe", actionKey: "moderate", isCritical: true, sortOrder: 112 },
  { key: "recipe.edit.foreign", name: "Fremde Rezepte bearbeiten", description: "Sonderberechtigung für fremde Rezepte.", category: "recipes", areaKey: "recipe", actionKey: "edit", isCritical: true, sortOrder: 113 },
  { key: "recipe.delete.foreign", name: "Fremde Rezepte löschen", description: "Sonderberechtigung für fremde Rezepte.", category: "recipes", areaKey: "recipe", actionKey: "delete", isCritical: true, sortOrder: 114 },
  { key: "recipe.manage.admin", name: "Admin-Rezepte verwalten", description: "Offizielle Rezeptdatenbank verwalten.", category: "recipes", areaKey: "recipe", actionKey: "manage", isCritical: true, sortOrder: 115 },
];

const COURSE_PERMISSIONS: PermissionCatalogEntry[] = [
  { key: "course.list.view", name: "Kursübersicht sehen", description: "Kursliste anzeigen.", category: "courses", sortOrder: 200 },
  { key: "course.detail.view", name: "Kursdetail sehen", description: "Kursdetailseite öffnen.", category: "courses", sortOrder: 201 },
  { key: "course.purchase", name: "Kurs kaufen", description: "Kurs kaufen oder buchen.", category: "courses", sortOrder: 202 },
  { key: "course.access.open", name: "Eingeschriebenen Kurs öffnen", description: "Zugriff auf freigeschaltete Kurse.", category: "courses", sortOrder: 203 },
  { key: "course.lessons.view", name: "Lektionen ansehen", description: "Kurslektionen ansehen.", category: "courses", sortOrder: 204 },
  { key: "course.downloads.use", name: "Downloads benutzen", description: "Kursdownloads herunterladen.", category: "courses", sortOrder: 205 },
  { key: "course.comments.write", name: "Kommentare schreiben", description: "Kurskommentare verfassen.", category: "courses", sortOrder: 206 },
  { key: "course.forum.open", name: "Kursforum öffnen", description: "Kursforum nutzen.", category: "forum", sortOrder: 207 },
  { key: "course.review.write", name: "Kurs bewerten", description: "Kursbewertung abgeben.", category: "courses", sortOrder: 208 },
  { key: "certificate.download", name: "Zertifikat herunterladen", description: "Eigenes Zertifikat herunterladen.", category: "certificates", sortOrder: 209 },
  { key: "certificate.share", name: "Zertifikat teilen", description: "Eigenes Zertifikat teilen.", category: "certificates", sortOrder: 210 },
];

const FORUM_PERMISSIONS: PermissionCatalogEntry[] = [
  { key: "forum.view", name: "Forum sehen", description: "Forum in Navigation sichtbar.", category: "forum", sortOrder: 300 },
  { key: "forum.open", name: "Forum öffnen", description: "Forum öffnen und lesen.", category: "forum", sortOrder: 301 },
  { key: "forum.thread.create", name: "Themen erstellen", description: "Neue Forenthemen anlegen.", category: "forum", sortOrder: 302 },
  { key: "forum.reply.create", name: "Antworten schreiben", description: "Auf Beiträge antworten.", category: "forum", sortOrder: 303 },
  { key: "forum.post.edit.own", name: "Eigene Beiträge bearbeiten", description: "Nur eigene Beiträge bearbeiten.", category: "forum", sortOrder: 304 },
  { key: "forum.post.delete.own", name: "Eigene Beiträge löschen", description: "Nur eigene Beiträge löschen.", category: "forum", sortOrder: 305 },
  { key: "forum.moderate", name: "Forum moderieren", description: "Beiträge moderieren und sperren.", category: "forum", isCritical: true, sortOrder: 306 },
  { key: "forum.post.delete.foreign", name: "Fremde Beiträge löschen", description: "Fremde Beiträge löschen.", category: "forum", isCritical: true, sortOrder: 307 },
  { key: "forum.manage", name: "Forum verwalten", description: "Forum-Einstellungen verwalten.", category: "forum", isCritical: true, sortOrder: 308 },
];

const GENERAL_PERMISSIONS: PermissionCatalogEntry[] = [
  { key: "general.member-area.view", name: "Mitgliederbereich sehen", description: "Zugriff auf Mein Bereich.", category: "general", sortOrder: 1 },
  { key: "general.public-content.view", name: "Öffentliche Inhalte sehen", description: "Öffentliche Seiten und Inhalte.", category: "general", sortOrder: 2 },
  { key: "profile.own.view", name: "Eigenes Profil sehen", description: "Eigenes Profil anzeigen.", category: "profile", sortOrder: 10 },
  { key: "profile.own.edit", name: "Eigenes Profil bearbeiten", description: "Eigene Profildaten ändern.", category: "profile", sortOrder: 11 },
  { key: "messages.own.view", name: "Eigene Nachrichten", description: "Eigene Nachrichten lesen.", category: "profile", sortOrder: 12 },
  { key: "tickets.own.create", name: "Eigenes Ticket erstellen", description: "Support-Ticket erstellen.", category: "tickets", sortOrder: 400 },
  { key: "tickets.own.view", name: "Eigene Tickets sehen", description: "Eigene Tickets einsehen.", category: "tickets", sortOrder: 401 },
  { key: "blog.public.view", name: "Blog/Magazin lesen", description: "Veröffentlichte Blogbeiträge lesen.", category: "blog", sortOrder: 500 },
  { key: "social.share.own", name: "Eigene Inhalte teilen", description: "Eigene freigegebene Inhalte teilen.", category: "social", sortOrder: 600 },
  { key: "membership.benefits.view", name: "Mitgliedschaftsvorteile sehen", description: "Club-Vorteile und -Inhalte.", category: "membership", sortOrder: 20 },
  { key: "system.permissions.manage", name: "Berechtigungen verwalten", description: "Gruppen und Rechte administrieren.", category: "system", isCritical: true, superAdminOnly: true, sortOrder: 9000 },
  { key: "system.superadmin", name: "Superadministrator", description: "Vollzugriff auf Rechteverwaltung.", category: "system", isCritical: true, superAdminOnly: true, sortOrder: 9001 },
  { key: "system.maintenance.bypass", name: "Wartungsmodus umgehen", description: "Website trotz Wartungsmodus nutzen.", category: "system", sortOrder: 9002 },
];

function buildCatalog(): PermissionCatalogEntry[] {
  const entries: PermissionCatalogEntry[] = [...GENERAL_PERMISSIONS];

  WORKSHOP_AREAS.forEach((area, index) => {
    entries.push(...areaPermissions(area, 1000 + index * 20));
  });

  entries.push(...RECIPE_PERMISSIONS);

  ADMIN_AREAS.forEach((area, index) => {
    entries.push(
      ...areaPermissions(
        {
          ...area,
          actions: ["view", "open", "create", "edit", "delete", "publish", "export", "manage"],
        },
        5000 + index * 20,
      ),
    );
  });

  entries.push(...COURSE_PERMISSIONS, ...FORUM_PERMISSIONS);
  return entries;
}

export const PERMISSION_CATALOG: PermissionCatalogEntry[] = buildCatalog();

export const PERMISSION_CATALOG_BY_KEY = new Map(
  PERMISSION_CATALOG.map((entry) => [entry.key, entry]),
);

export function isKnownPermissionKey(key: string): boolean {
  return PERMISSION_CATALOG_BY_KEY.has(key);
}

export function getPermissionsByCategory(category: string): PermissionCatalogEntry[] {
  return PERMISSION_CATALOG.filter((entry) => entry.category === category);
}

export const LEGACY_ADMIN_PERMISSION_MAP: Record<string, string> = {
  "users.read": "admin.users.view",
  "users.write": "admin.users.manage",
  "users.suspend": "admin.users.edit",
  "users.delete": "admin.users.delete",
  "courses.read": "admin.courses.view",
  "courses.write": "admin.courses.manage",
  "memberships.write": "admin.memberships.manage",
  "orders.read": "admin.orders.view",
  "certificates.write": "admin.certificates.manage",
  "reviews.moderate": "admin.reviews.manage",
  "forums.moderate": "admin.forums.manage",
  "tickets.read": "admin.tickets.view",
  "tickets.write": "admin.tickets.edit",
  "tickets.assign": "admin.tickets.manage",
  "tickets.admin": "admin.tickets.manage",
  "blog.read": "admin.blog.view",
  "blog.write": "admin.blog.edit",
  "blog.publish": "admin.blog.publish",
  "settings.write": "admin.system-settings.manage",
  "content.manage": "admin.media.manage",
  "legal.manage": "admin.privacy.manage",
  "privacy.manage": "admin.privacy.manage",
  "maintenance.bypass": "system.maintenance.bypass",
  "email.view": "admin.email.view",
  "email.manage": "admin.email.manage",
  "email.send": "admin.email.use",
  "email.templates.manage": "admin.email.manage",
  "email.providers.manage": "admin.email.manage",
  "email.logs.view": "admin.email.view",
  "email.retry": "admin.email.manage",
  "email.attachments.send": "admin.email.use",
  "email.send.external": "admin.email.use",
  "email.bulk.send": "admin.email.manage",
};
