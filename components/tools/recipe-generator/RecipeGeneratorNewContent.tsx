"use client";

/**
 * @file RecipeGeneratorNewContent.tsx
 * @purpose Neues Rezept — mit Mitgliedschaftsprüfung.
 */

import Link from "next/link";

import MembershipBlockedNotice from "@/components/membership/MembershipBlockedNotice";
import RecipeGeneratorWizard from "@/components/tools/recipe-generator/RecipeGeneratorWizard";
import { useMembershipAccess } from "@/lib/membership/use-membership-access";

/**
 * Zeigt den Wizard nur bei Berechtigung zum Anlegen eigener Rezepte.
 */
export default function RecipeGeneratorNewContent() {
  const membership = useMembershipAccess();
  const createCheck = membership.canCreateRecipe(0);

  if (!createCheck.allowed) {
    return (
      <div className="space-y-6">
        <MembershipBlockedNotice message={createCheck.message} />
        <p className="text-center">
          <Link
            href="/werkstatt/rezeptgenerator"
            className="text-sm font-semibold text-aw-gold hover:text-aw-cream"
          >
            ← Zur Rezeptübersicht
          </Link>
        </p>
      </div>
    );
  }

  return <RecipeGeneratorWizard />;
}
