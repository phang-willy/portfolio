import { ProjectsPageGrid } from "@/app/(main)/projects/projects-page-grid";
import { getDictionary } from "@/features/i18n/dictionaries/get-dictionary";
import { projectRecordForLocale } from "@/features/i18n/lib/localized-site-data";
import { openGraphLocaleFields } from "@/features/i18n/lib/opengraph-locale";
import { getRequestLocale } from "@/features/i18n/lib/request-locale";
import { getProjectsByCreatedAtDesc } from "@/lib/projects";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale();
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

export default async function ProjectsListPage() {
  const locale = await getRequestLocale();
  const projects = getProjectsByCreatedAtDesc().map((p) =>
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
