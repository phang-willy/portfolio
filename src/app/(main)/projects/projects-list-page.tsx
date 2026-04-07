import { ProjectsPageGrid } from "@/app/(main)/projects/projects-page-grid";
import type { AppLocale } from "@/features/i18n/config/locales";
import { getDictionary } from "@/features/i18n/dictionaries/get-dictionary";
import { projectRecordForLocale } from "@/features/i18n/lib/localized-site-data";
import { openGraphLocaleFields } from "@/features/i18n/lib/opengraph-locale";
import { getProjectsByCreatedAtDesc } from "@/lib/projects";
import type { Metadata } from "next";

export function buildProjectsListMetadata(locale: AppLocale): Metadata {
  const d = getDictionary(locale);
  return {
    title: `${process.env.APP_TITLE} - ${d.meta.projectsTitle}`,
    description: `${process.env.APP_TITLE} - ${d.meta.projectsDescription}`,
    openGraph: {
      title: `${process.env.APP_TITLE} - ${d.meta.projectsTitle}`,
      description: `${process.env.APP_TITLE} - ${d.meta.projectsDescription}`,
      ...openGraphLocaleFields(locale),
    },
  };
}

export async function ProjectsListPage({ locale }: { locale: AppLocale }) {
  const projects = (await getProjectsByCreatedAtDesc()).map((p) =>
    projectRecordForLocale(p, locale),
  );
  const d = getDictionary(locale);

  return (
    <>
      <section className="container mx-auto p-4 flex flex-col gap-8 overflow-x-clip">
        <div className="grid grid-cols-1 gap-8">
          <h1 className="text-3xl font-bold">{d.projectsPage.title}</h1>
          <p className="text-base text-muted-foreground leading-8 max-w-xl">
            {d.projectsPage.intro}
          </p>
        </div>
        <div className="hidden md:block">
          <p className="text-center text-gray-500 leading-8">
            {d.projectsPage.hoverHintDesktop}
          </p>
        </div>
        <ProjectsPageGrid projects={projects} locale={locale} />
      </section>
    </>
  );
}
