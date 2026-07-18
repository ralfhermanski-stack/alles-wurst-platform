import { Suspense } from "react";

import MemberTopbar from "@/components/member/MemberTopbar";
import MemberNav from "@/components/member/MemberNav";
import ChallengePopupGate from "@/components/challenges/ChallengePopupGate";
import EmailVerificationBanner from "@/components/auth/EmailVerificationBanner";

/**
 * Layout für den gesamten Mitgliederbereich (mein-bereich + account/*).
 */
export default function MemberAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <Suspense fallback={null}>
        <EmailVerificationBanner />
      </Suspense>
      <MemberTopbar />
      <MemberNav />
      <ChallengePopupGate />
      <main className="flex-1 bg-aw-bg">{children}</main>
    </div>
  );
}
