import { ProjectsPageGrid } from "@/app/(main)/projects/projects-page-grid";
import type { AppLocale } from "@/features/i18n/config/locales";
import { getDictionary } from "@/features/i18n/dictionaries/get-dictionary";
import { projectRecordForLocale } from "@/features/i18n/lib/localized-site-data";
import { openGraphLocaleFields } from "@/features/i18n/lib/opengraph-locale";
import { appName } from "@/lib/app-name";
import { getProjectsByCreatedAtDesc } from "@/lib/projects";
import type { Metadata } from "next";
import { connection } from "next/server";

export function buildProjectsListMetadata(locale: AppLocale): Metadata {
  const d = getDictionary(locale);
  return {
    title: `${appName} - ${d.project.metaTitle}`,
    description: `${appName} - ${d.project.metaDescription}`,
    openGraph: {
      title: `${appName} - ${d.project.metaTitle}`,
      description: `${appName} - ${d.project.metaDescription}`,
      ...openGraphLocaleFields(locale),
    },
  };
}

export async function ProjectsListPage({ locale }: { locale: AppLocale }) {
  await connection();
  const projects = (await getProjectsByCreatedAtDesc()).map((p) =>
    projectRecordForLocale(p, locale),
  );
  const d = getDictionary(locale);

  return (
    <>
      <section
        className="container mx-auto p-4 flex flex-col gap-8 overflow-x-clip"
        aria-labelledby="projects-page-title"
      >
        <div className="grid grid-cols-1 gap-8">
          <h1 id="projects-page-title" className="text-3xl font-bold">
            {d.project.page.title}
          </h1>
          <p className="text-base text-muted-foreground leading-8 max-w-xl">
            {d.project.page.intro}
          </p>
        </div>
        {projects.length === 0 ? (
          <p className="text-lg text-muted-foreground leading-8">
            {d.project.empty}
          </p>
        ) : (
          <>
            <div className="hidden md:block">
              <p className="text-center text-gray-500 leading-8">
                {d.project.page.hoverHintDesktop}
              </p>
            </div>
            <ProjectsPageGrid projects={projects} locale={locale} />
          </>
        )}
      </section>
    </>
  );
}
