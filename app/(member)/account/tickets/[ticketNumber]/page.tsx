import UserSupportTicketDetail from "@/components/support/UserSupportTicketDetail";

type PageProps = {
  params: Promise<{ ticketNumber: string }>;
};

export default async function AccountTicketDetailPage({ params }: PageProps) {
  const { ticketNumber } = await params;

  return (
    <UserSupportTicketDetail
      ticketNumber={ticketNumber}
      backHref="/account/tickets"
      ticketBasePath="/account/tickets"
    />
  );
}
