import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { getUserOrderDetail } from "@/lib/account/account-order-service";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";
import { formatMoney } from "@/lib/payments/format-money";
import {
  primaryButtonClassName,
  secondaryButtonClassName,
} from "@/components/tools/recipe-generator/recipe-form-classes";

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

  return (
    <section className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
      <div>
        <Link href="/mein-bereich/bestellungen" className="text-sm text-aw-gold hover:underline">
          ← Zurück zu Bestellungen
        </Link>
        <h1 className="mt-4 font-display text-2xl font-bold text-aw-cream">
          {order.productName}
        </h1>
        <p className="mt-2 text-sm text-aw-muted">
          Bestellnummer {order.orderNumber} ·{" "}
          {new Date(order.createdAt).toLocaleDateString("de-DE")}
        </p>
      </div>

      <div className="grid gap-4 rounded-xl border border-aw-border bg-aw-surface p-5 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-aw-muted">Preis</p>
          <p className="text-aw-cream">
            {formatMoney(order.grossAmount, order.currency)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase text-aw-muted">Zahlungsstatus</p>
          <p className="text-aw-cream">{order.paymentStatus}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-aw-muted">Zugriffsstatus</p>
          <p className="text-aw-cream">{order.accessStatus ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs uppercase text-aw-muted">Freischaltung</p>
          <p className="text-aw-cream">
            {order.accessMode === "DELAYED" && order.pendingAccessUntil
              ? `Verzögert bis ${new Date(order.pendingAccessUntil).toLocaleDateString("de-DE")}`
              : order.accessMode ?? "—"}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-aw-border bg-aw-surface p-5">
        <h2 className="font-display text-lg font-bold text-aw-cream">
          Deine Vertragsunterlagen
        </h2>
        <p className="mt-2 text-sm text-aw-muted">
          Diese Unterlagen entsprechen den Fassungen, die zum Zeitpunkt deines Kaufs
          gültig waren.
        </p>
        <ul className="mt-4 space-y-3">
          {order.legalDocuments.length === 0 ? (
            <li className="text-sm text-aw-muted">
              Vertragsunterlagen werden nach dem Kauf erzeugt.
            </li>
          ) : (
            order.legalDocuments.map((document) => (
              <li
                key={document.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-aw-border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-aw-cream">{document.title}</p>
                  <p className="text-xs text-aw-muted">
                    Version {document.versionLabel ?? "—"} · {document.status}
                  </p>
                </div>
                {document.status === "GENERATED" && (
                  <a
                    href={`/api/account/orders/${order.id}/documents/${document.id}/download`}
                    className={secondaryButtonClassName}
                  >
                    PDF herunterladen
                  </a>
                )}
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="rounded-xl border border-aw-border bg-aw-surface p-5">
        <h2 className="font-display text-lg font-bold text-aw-cream">Widerruf</h2>
        {order.openWithdrawalNumber ? (
          <p className="mt-2 text-sm text-aw-muted">
            Offene Widerrufsanfrage: {order.openWithdrawalNumber}
          </p>
        ) : order.withdrawalEligible && order.withdrawalToken ? (
          <>
            {order.withdrawalExpiredNotice && (
              <p className="mt-2 text-sm text-amber-300">
                Die reguläre Widerrufsfrist könnte bereits abgelaufen sein. Du kannst
                deine Erklärung dennoch absenden. Sie wird individuell geprüft.
              </p>
            )}
            <Link
              href={`/widerrufsformular?order=${encodeURIComponent(order.withdrawalToken)}`}
              className={`${primaryButtonClassName} mt-4 inline-flex`}
            >
              Vertrag widerrufen
            </Link>
          </>
        ) : (
          <p className="mt-2 text-sm text-aw-muted">
            Für diese Bestellung ist aktuell kein Widerruf über das Konto möglich.
          </p>
        )}
      </div>
    </section>
  );
}
