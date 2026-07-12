/**
 * @file help-hub-config.ts
 * @purpose Zentrale Konfiguration für Hilfe-Center-Karten und Links.
 */

export type HelpHubCard = {
  id: string;
  icon: string;
  titleKey: string;
  descriptionKey: string;
  href: string;
  requiresAuth?: boolean;
  requiresMeisterclub?: boolean;
};

export const HELP_HUB_CARDS: HelpHubCard[] = [
  {
    id: "knowledge",
    icon: "book",
    titleKey: "help.knowledge.title",
    descriptionKey: "help.knowledge.description",
    href: "/hilfe/wissen",
  },
  {
    id: "tickets",
    icon: "ticket",
    titleKey: "help.tickets.title",
    descriptionKey: "help.tickets.description",
    href: "/account/tickets",
    requiresAuth: true,
  },
  {
    id: "community",
    icon: "users",
    titleKey: "help.community.title",
    descriptionKey: "help.community.description",
    href: "/community",
  },
  {
    id: "master",
    icon: "crown",
    titleKey: "help.master.title",
    descriptionKey: "help.master.description",
    href: "/hilfe/meister-support",
    requiresMeisterclub: true,
  },
];

export const MEISTER_SUPPORT_CATEGORY_SLUG = "meister-support";
