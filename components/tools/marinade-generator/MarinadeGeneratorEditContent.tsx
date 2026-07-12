"use client";

import Link from "next/link";

import MembershipBlockedNotice from "@/components/membership/MembershipBlockedNotice";
import MarinadeGeneratorWizard from "@/components/tools/marinade-generator/MarinadeGeneratorWizard";
import { useMembershipAccess } from "@/lib/membership/use-membership-access";

export default function MarinadeGeneratorEditContent({
  recipeId,
}: {
  recipeId: string;
}) {
  const membership = useMembershipAccess();
  const useCheck = membership.check("marinade.use");

  if (!useCheck.allowed) {
    return (
      <div className="space-y-6">
        <MembershipBlockedNotice message={useCheck.message} />
        <p className="text-center">
          <Link
            href="/werkstatt/marinaden-generator"
            className="text-sm font-semibold text-aw-gold hover:text-aw-cream"
          >
            ← Zur Marinaden-Übersicht
          </Link>
        </p>
      </div>
    );
  }

  return (
    <MarinadeGeneratorWizard
      recipeId={recipeId}
      demoMode={!membership.check("marinade.save").allowed}
    />
  );
}
