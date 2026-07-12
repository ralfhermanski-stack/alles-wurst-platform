import Link from "next/link";
import { redirect } from "next/navigation";

import { listUserOrders } from "@/lib/account/account-order-service";
import { getSessionUserIdFromCookies } from "@/lib/auth/session";
import { formatMoney } from "@/lib/payments/format-money";

export default async function MeinBereichBestellungenPage() {
  const userId = await getSessionUserIdFromCookies();

  if (!userId) {
    redirect("/anmelden?next=/mein-bereich/bestellungen");
  }

  const orders = await listUserOrders(userId);

  return (
    <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-2xl font-bold text-aw-cream">Bestellungen</h1>
      <p className="mt-2 text-sm text-aw-muted">
        Deine Käufe, Vertragsunterlagen und Widerrufsmöglichkeiten.
      </p>

      {orders.length === 0 ? (
        <p className="mt-8 text-sm text-aw-muted">Noch keine Bestellungen vorhanden.</p>
      ) : (
        <ul className="mt-8 space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-xl border border-aw-border bg-aw-surface px-5 py-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-aw-cream">{order.productName}</p>
                  <p className="text-xs text-aw-muted">
                    {order.orderNumber} · {new Date(order.createdAt).toLocaleDateString("de-DE")}
                  </p>
                  <p className="mt-1 text-sm text-aw-muted">
                    {formatMoney(order.grossAmount, order.currency)} · {order.paymentStatus}
                    {order.accessStatus ? ` · Zugang: ${order.accessStatus}` : ""}
                  </p>
                </div>
                <Link
                  href={`/mein-bereich/bestellungen/${order.id}`}
                  className="text-sm font-medium text-aw-gold hover:underline"
                >
                  Details →
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
