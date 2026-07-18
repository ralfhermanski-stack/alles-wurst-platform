import { headers } from "next/headers";
import { Suspense } from "react";

import MemberTopbar from "@/components/member/MemberTopbar";
import MemberNav from "@/components/member/MemberNav";
import ChallengePopupGate from "@/components/challenges/ChallengePopupGate";
import EmailVerificationBanner from "@/components/auth/EmailVerificationBanner";
import { requirePagePermission } from "@/lib/permissions/page-guard";

/**
 * Layout für den gesamten Mitgliederbereich (mein-bereich + account/*).
 */
export default async function MemberAreaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "/mein-bereich";

  await requirePagePermission(pathname);

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
