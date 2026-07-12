import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import PageHeader from "@/components/marketing/PageHeader";
import SupportTicketCreateForm from "@/components/support/SupportTicketCreateForm";
import PlatformText from "@/components/platform-text/PlatformText";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";
import {
  getUserMembershipRole,
  hasMeisterclubAccess,
} from "@/lib/help/help-membership";
import { MEISTER_SUPPORT_CATEGORY_SLUG } from "@/lib/help/help-hub-config";
import { getPlatformText } from "@/lib/platform-text/platform-text-service";
import { buildStaticPageMetadata } from "@/lib/page-seo/page-seo-static-metadata";

export async function generateMetadata(): Promise<Metadata> {
  return buildStaticPageMetadata("/hilfe/meister-support", {
    title: "Meister-Support",
    description: "Exklusiver Support für Meisterclub-Mitglieder.",
  });
}

export default async function MeisterSupportPage() {
  const userId = await getSessionUserIdFromCookies();

  if (!userId) {
    redirect("/anmelden?next=/hilfe/meister-support");
  }

  const role = await getUserMembershipRole(userId);
  const allowed = hasMeisterclubAccess(role);
  const lockedMessage = await getPlatformText(
    "help.masterSupportLocked",
    "Der Meister-Support ist exklusiv für Mitglieder der Meisterklasse.",
  );

  if (!allowed) {
    return (
      <>
        <PageHeader
          eyebrow="Meister-Support"
          title={
            <PlatformText
              textKey="help.master.title"
              elementType="heading"
              as="span"
              fallback="Meister-Support"
            />
          }
          description={lockedMessage}
        />
        <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <Link
            href="/mitgliedschaft"
            className="inline-flex rounded-md bg-aw-gold px-6 py-3 text-sm font-semibold text-aw-bg hover:bg-aw-gold-dark"
          >
            Zur Meisterklasse
          </Link>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Meister-Support"
        title={
          <PlatformText
            textKey="help.master.title"
            elementType="heading"
            as="span"
            fallback="Meister-Support"
          />
        }
        description="Direkter Support mit höchster Priorität für Meisterclub-Mitglieder."
      />

      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Suspense fallback={<p className="text-sm text-aw-muted">Wird geladen …</p>}>
          <SupportTicketCreateForm
            defaultCategorySlug={MEISTER_SUPPORT_CATEGORY_SLUG}
            lockCategory
            hidePriority
            successRedirectBase="/account/tickets"
          />
        </Suspense>
      </section>
    </>
  );
}
