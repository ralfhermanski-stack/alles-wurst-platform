import type { Metadata } from "next";

import MembershipManagePanel from "@/components/member/MembershipManagePanel";

export const metadata: Metadata = {
  title: "Meine Mitgliedschaft",
  description: "Laufzeit, Verlängerung und Kündigung deiner Mitgliedschaft.",
};

export default function MeinBereichMembershipPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-bold text-aw-cream">
        Meine Mitgliedschaft
      </h1>
      <p className="mt-2 text-sm text-aw-muted">
        Hier siehst du Laufzeit, Verlängerung und kannst zum Periodenende kündigen.
      </p>

      <div className="mt-8 rounded-xl border border-aw-border bg-aw-surface/40 p-6">
        <MembershipManagePanel />
      </div>
    </div>
  );
}
