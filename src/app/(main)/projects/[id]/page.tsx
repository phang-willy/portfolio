import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectDetailContent } from "@/app/(main)/projects/[id]/project-detail-content";
import { PROJECT_IMAGE_FALLBACK_PATH } from "@/lib/project-image";
import { getProjectById, getProjectsByCreatedAtDesc } from "@/lib/projects";

type ProjectPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return getProjectsByCreatedAtDesc().map((p) => ({ id: p.id }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) {
    return { title: `${process.env.APP_TITLE} - Projet` };
  }
  return {
    title: `${process.env.APP_TITLE} - ${project.name}`,
    description: project.description,
    openGraph: {
      type: "website",
      title: `${process.env.APP_TITLE} - ${project.name}`,
      description: project.description,
      images: [{ url: project.image || PROJECT_IMAGE_FALLBACK_PATH }],
    },
  };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const project = getProjectById(id);
  if (!project) notFound();

  return <ProjectDetailContent project={project} />;
}
