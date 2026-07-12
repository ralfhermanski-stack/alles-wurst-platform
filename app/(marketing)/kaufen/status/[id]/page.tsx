import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import CheckoutStatusPanel from "@/components/checkout/CheckoutStatusPanel";
import PageHeader from "@/components/marketing/PageHeader";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";
import { getCheckoutDetailsForUser } from "@/lib/payments/checkout-query-service";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ stripe?: string }>;
};

export const metadata: Metadata = {
  title: "Checkout-Status",
  description: "Status deiner vorbereiteten Zahlung bei Alles Wurst.",
};

export default async function KaufenStatusPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const query = await searchParams;
  const userId = await getSessionUserIdFromCookies();

  if (!userId) {
    redirect(`/anmelden?next=/kaufen/status/${id}`);
  }

  const result = await getCheckoutDetailsForUser(id, userId, {
    stripeReturn: query.stripe === "return",
    stripeCancelled: query.stripe === "cancelled",
  });

  if (!result.success) {
    notFound();
  }

  if (!result.data) {
    notFound();
  }

  return (
    <>
      <PageHeader
        eyebrow="Checkout"
        title="Zahlungsstatus"
        description="Hier siehst du den Stand deiner Zahlung. Die Freischaltung erfolgt nur nach bestätigtem Webhook."
      />

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <CheckoutStatusPanel initialDetails={result.data} checkoutId={id} />
        <Link
          href="/kaufen"
          className="mt-8 inline-block text-sm font-medium text-aw-gold hover:text-aw-cream"
        >
          ← Zur Produktübersicht
        </Link>
      </section>
    </>
  );
}
