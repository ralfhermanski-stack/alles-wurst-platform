import { Suspense } from "react";

import SupportTicketCreateForm from "@/components/support/SupportTicketCreateForm";

export default function AccountTicketsNewPage() {
  return (
    <Suspense fallback={<p className="px-4 py-8 text-sm text-aw-muted">Wird geladen …</p>}>
      <SupportTicketCreateForm
        successRedirectBase="/account/tickets"
        cancelHref="/account/tickets"
      />
    </Suspense>
  );
}
