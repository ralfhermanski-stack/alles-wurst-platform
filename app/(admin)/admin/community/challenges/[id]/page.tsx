import AdminChallengeForm from "@/components/admin/challenges/AdminChallengeForm";

export const metadata = {
  title: "Challenge bearbeiten",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminChallengeEditPage({ params }: PageProps) {
  const { id } = await params;

  return <AdminChallengeForm challengeId={id} />;
}
