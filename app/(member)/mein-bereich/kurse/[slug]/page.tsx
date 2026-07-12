import CourseLearningHub from "@/components/courses/CourseLearningHub";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function CourseLearningPage({ params }: PageProps) {
  const { slug } = await params;

  return <CourseLearningHub slug={slug} />;
}
