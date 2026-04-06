import { ProjectDetailContent } from "@/app/(main)/projects/[id]/project-detail-content";
import { getDictionary } from "@/features/i18n/dictionaries/get-dictionary";
import { projectRecordForLocale } from "@/features/i18n/lib/localized-site-data";
import { openGraphLocaleFields } from "@/features/i18n/lib/opengraph-locale";
import { getRequestLocale } from "@/features/i18n/lib/request-locale";
import { PROJECT_IMAGE_FALLBACK_PATH } from "@/lib/project-image";
import { getProjectById, getProjectsByCreatedAtDesc } from "@/lib/projects";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
  const raw = getProjectById(id);
  const locale = await getRequestLocale();
  const d = getDictionary(locale);

  if (!raw) {
    return {
      title: `${process.env.APP_TITLE} - ${d.meta.projectFallbackTitle}`,
      openGraph: openGraphLocaleFields(locale),
    };
  }

  const project = projectRecordForLocale(raw, locale);

  return {
    title: `${process.env.APP_TITLE} - ${project.name}`,
    description: project.description,
    openGraph: {
      type: "website",
      title: `${process.env.APP_TITLE} - ${project.name}`,
      description: project.description,
      images: [{ url: project.image || PROJECT_IMAGE_FALLBACK_PATH }],
      ...openGraphLocaleFields(locale),
    },
  };
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const raw = getProjectById(id);
  if (!raw) notFound();

  const locale = await getRequestLocale();
  const project = projectRecordForLocale(raw, locale);

  return <ProjectDetailContent project={project} />;
}
