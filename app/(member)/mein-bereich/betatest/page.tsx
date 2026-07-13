import type { Metadata } from "next";

import BetaTesterTasksPanel from "@/components/member/BetaTesterTasksPanel";

export const metadata: Metadata = {
  title: "Betatest-Aufträge",
};

export default function BetaTestTasksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <BetaTesterTasksPanel />
    </div>
  );
}
