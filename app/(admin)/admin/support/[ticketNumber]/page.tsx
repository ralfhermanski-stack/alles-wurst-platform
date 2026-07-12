import AdminSupportTicketDetail from "@/components/admin/support/AdminSupportTicketDetail";

type PageProps = {
  params: Promise<{ ticketNumber: string }>;
};

export default async function AdminSupportTicketPage({ params }: PageProps) {
  const { ticketNumber } = await params;

  return (
    <AdminSupportTicketDetail ticketNumber={decodeURIComponent(ticketNumber)} />
  );
}
