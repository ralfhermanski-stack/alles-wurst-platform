import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import ContractConfirmationPanel, {
  OrderWithdrawalSection,
} from "@/components/account/ContractConfirmationPanel";
import { getUserOrderDetail } from "@/lib/account/account-order-service";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";

type PageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function MeinBereichBestellungDetailPage({ params }: PageProps) {
  const userId = await getSessionUserIdFromCookies();

  if (!userId) {
    redirect("/anmelden");
  }

  const { orderId } = await params;
  const result = await getUserOrderDetail(userId, orderId);

  if (!result.success) {
    notFound();
  }

  const order = result.data;

  if (!order.contract) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <div>
        <Link
          href="/mein-bereich/bestellungen"
          className="text-sm text-aw-gold hover:underline"
        >
          ← Zurück zu Bestellungen
        </Link>
      </div>

      <ContractConfirmationPanel
        contract={order.contract}
        orderId={order.id}
        legalDocuments={order.legalDocuments}
        withdrawalSection={
          <OrderWithdrawalSection
            order={{
              openWithdrawalNumber: order.openWithdrawalNumber,
              withdrawalEligible: order.withdrawalEligible,
              withdrawalToken: order.withdrawalToken,
              withdrawalExpiredNotice: order.withdrawalExpiredNotice,
            }}
          />
        }
      />
    </section>
  );
}
