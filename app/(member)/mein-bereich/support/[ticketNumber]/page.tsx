import UserSupportTicketDetail from "@/components/support/UserSupportTicketDetail";

type PageProps = {
  params: Promise<{ ticketNumber: string }>;
};

export default async function SupportTicketPage({ params }: PageProps) {
  const { ticketNumber } = await params;

  return <UserSupportTicketDetail ticketNumber={decodeURIComponent(ticketNumber)} />;
}
