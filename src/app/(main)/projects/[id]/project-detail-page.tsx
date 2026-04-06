import { ProjectDetailContent } from "@/app/(main)/projects/[id]/project-detail-content";
import type { AppLocale } from "@/features/i18n/config/locales";
import { getDictionary } from "@/features/i18n/dictionaries/get-dictionary";
import { projectRecordForLocale } from "@/features/i18n/lib/localized-site-data";
import { openGraphLocaleFields } from "@/features/i18n/lib/opengraph-locale";
import { PROJECT_IMAGE_FALLBACK_PATH } from "@/lib/project-image";
import { getProjectById, getProjectsByCreatedAtDesc } from "@/lib/projects";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type ProjectPageParams = {
  params: Promise<{ id: string }>;
};

type ProjectPageProps = ProjectPageParams & { locale: AppLocale };

export function generateStaticParams() {
  return getProjectsByCreatedAtDesc().map((p) => ({ id: p.id }));
}

export async function generateProjectMetadata({
  params,
  locale,
}: ProjectPageProps): Promise<Metadata> {
  const { id } = await params;
  const raw = getProjectById(id);
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

export async function ProjectDetailPage({ params, locale }: ProjectPageProps) {
  const { id } = await params;
  const raw = getProjectById(id);
  if (!raw) notFound();

  const project = projectRecordForLocale(raw, locale);

  return <ProjectDetailContent project={project} />;
}
