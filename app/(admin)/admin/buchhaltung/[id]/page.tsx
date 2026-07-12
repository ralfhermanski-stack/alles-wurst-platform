import type { Metadata } from "next";

import AccountingUserPanel from "@/components/accounting/AccountingUserPanel";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  return {
    title: "Buchhaltung — Nutzer",
    description: `Mitgliedschaft und Zahlung für Nutzer ${id} verwalten.`,
  };
}

export default async function BuchhaltungUserPage({ params }: PageProps) {
  const { id } = await params;

  return <AccountingUserPanel userId={id} />;
}
