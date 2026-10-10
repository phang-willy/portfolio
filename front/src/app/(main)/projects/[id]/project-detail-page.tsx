import { ProjectDetailContent } from "@/app/(main)/projects/[id]/project-detail-content";
import type { AppLocale } from "@/features/i18n/config/locales";
import { getDictionary } from "@/features/i18n/dictionaries/get-dictionary";
import { projectRecordForLocale } from "@/features/i18n/lib/localized-site-data";
import { openGraphLocaleFields } from "@/features/i18n/lib/opengraph-locale";
import { appName } from "@/lib/app-name";
import { PROJECT_IMAGE_FALLBACK_PATH } from "@/lib/project-image";
import { getProjectById } from "@/lib/projects";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";

type ProjectPageParams = {
  params: Promise<{ id: string }>;
};

type ProjectPageProps = ProjectPageParams & { locale: AppLocale };

export async function generateProjectMetadata({
  params,
  locale,
}: ProjectPageProps): Promise<Metadata> {
  await connection();
  const { id } = await params;
  const raw = await getProjectById(id);
  const d = getDictionary(locale);

  if (!raw) {
    return {
      title: `${appName} - ${d.project.fallbackTitle}`,
      openGraph: openGraphLocaleFields(locale),
    };
  }

  const project = projectRecordForLocale(raw, locale);
  const kind = d.project.fallbackTitle;

  return {
    title: `${appName} - ${kind} - ${project.name}`,
    description: project.description,
    openGraph: {
      type: "website",
      title: `${appName} - ${kind} - ${project.name}`,
      description: project.description,
      images: [{ url: project.image || PROJECT_IMAGE_FALLBACK_PATH }],
      ...openGraphLocaleFields(locale),
    },
  };
}

export async function ProjectDetailPage({ params, locale }: ProjectPageProps) {
  await connection();
  const { id } = await params;
  const raw = await getProjectById(id);
  if (!raw) notFound();

  const project = projectRecordForLocale(raw, locale);

  return <ProjectDetailContent project={project} />;
}
