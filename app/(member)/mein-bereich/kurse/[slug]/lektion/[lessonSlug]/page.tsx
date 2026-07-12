import LessonView from "@/components/courses/LessonView";

type PageProps = {
  params: Promise<{ slug: string; lessonSlug: string }>;
};

export default async function LessonPage({ params }: PageProps) {
  const { slug, lessonSlug } = await params;

  return <LessonView courseSlug={slug} lessonSlug={lessonSlug} />;
}
