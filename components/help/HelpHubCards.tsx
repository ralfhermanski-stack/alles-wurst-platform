import Link from "next/link";

import HelpSupportCard from "@/components/help/HelpSupportCard";
import { getPlatformText } from "@/lib/platform-text/platform-text-service";
import PlatformText from "@/components/platform-text/PlatformText";
import { HELP_HUB_CARDS } from "@/lib/help/help-hub-config";
import {
  canAccessSupportTickets,
  getUserMembershipRole,
  hasMeisterclubAccess,
} from "@/lib/help/help-membership";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";

const CARD_TEXT_KEYS: Record<
  string,
  { title: string; description: string; titleFallback: string; descriptionFallback: string }
> = {
  knowledge: {
    title: "help.knowledge.title",
    description: "help.knowledge.description",
    titleFallback: "Wissensdatenbank",
    descriptionFallback:
      "Antworten auf häufige Fragen, Anleitungen und Hilfestellungen.",
  },
  tickets: {
    title: "help.tickets.title",
    description: "help.tickets.description",
    titleFallback: "Support-Tickets",
    descriptionFallback:
      "Stelle deine Fragen strukturiert und verfolge den Bearbeitungsstand.",
  },
  community: {
    title: "help.community.title",
    description: "help.community.description",
    titleFallback: "Community Forum",
    descriptionFallback:
      "Tausche Erfahrungen aus und lerne von anderen Mitgliedern.",
  },
  master: {
    title: "help.master.title",
    description: "help.master.description",
    titleFallback: "Meister-Support",
    descriptionFallback:
      "Exklusive Unterstützung für Meisterclub-Mitglieder.",
  },
};

export default async function HelpHubCards() {
  const userId = await getSessionUserIdFromCookies();
  const role = await getUserMembershipRole(userId);

  const visibleCards = HELP_HUB_CARDS.filter((card) => {
    if (card.requiresAuth && !canAccessSupportTickets(role)) {
      return false;
    }

    return true;
  });

  const texts = await Promise.all(
    visibleCards.map(async (card) => {
      const keys = CARD_TEXT_KEYS[card.id];

      const [title, description] = await Promise.all([
        getPlatformText(keys.title, keys.titleFallback),
        getPlatformText(keys.description, keys.descriptionFallback),
      ]);

      return { card, title, description };
    }),
  );

  return (
    <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {texts.map(({ card, title, description }) => {
        const href =
          card.requiresMeisterclub && !hasMeisterclubAccess(role)
            ? "/hilfe/meister-support"
            : card.requiresAuth && !userId
              ? `/anmelden?next=${encodeURIComponent(card.href)}`
              : card.href;

        return (
          <HelpSupportCard
            key={card.id}
            icon={card.icon}
            title={title}
            description={description}
            href={href}
          />
        );
      })}
    </div>
  );
}
